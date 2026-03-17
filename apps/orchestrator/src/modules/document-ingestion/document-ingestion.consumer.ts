import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { DocumentIngestionRequestedEvent } from "@rag-platform/contracts";
import { AppLoggerService, MetricsService } from "@rag-platform/observability";
import { DocumentIngestionInternalClient } from "@rag-platform/sdk";
import { randomUUID } from "node:crypto";
import {
  connect,
  type ChannelModel,
  type ConfirmChannel,
  type ConsumeMessage,
  type Message,
} from "amqplib";
import { DocumentIngestionWorkerService } from "./document-ingestion.worker";

@Injectable()
export class DocumentIngestionConsumerService
  implements OnModuleInit, OnModuleDestroy
{
  private connection: ChannelModel | null = null;
  private channel: ConfirmChannel | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
    private readonly metricsService: MetricsService,
    private readonly workerService: DocumentIngestionWorkerService,
    private readonly ingestionInternalClient: DocumentIngestionInternalClient,
  ) {}

  async onModuleInit(): Promise<void> {
    this.connection = await connect(
      this.configService.getOrThrow<string>("rabbitmq.url"),
    );
    this.channel = await this.connection.createConfirmChannel();
    await this.assertTopology(this.channel);
    await this.channel.prefetch(
      this.configService.get<number>("rabbitmq.prefetchCount", 5) ?? 5,
    );

    await this.channel.consume(
      this.configService.getOrThrow<string>("rabbitmq.queue"),
      async (message) => {
        await this.handleMessage(message);
      },
      { noAck: false },
    );
  }

  async handleMessage(message: ConsumeMessage | null): Promise<void> {
    if (!message || !this.channel) {
      return;
    }

    let payload: DocumentIngestionRequestedEvent | null = null;
    const retryCount = this.getRetryCount(message);

    try {
      payload = this.parseMessage(message);

      this.metricsService.increment("document_ingestion_consumer_received_total");
      this.logger.log(
        "Consumed document ingestion request",
        DocumentIngestionConsumerService.name,
        {
          sourceId: payload.sourceId,
          tenantId: payload.tenantId,
          eventId: payload.eventId,
          correlationId: payload.correlationId,
          retryCount,
          queue:
            this.configService.get<string>("rabbitmq.queue") ??
            "document.ingestion.requested",
        },
      );

      const result = await this.workerService.process(payload, retryCount);

      if (result.status === "skipped" && result.reason === "source_not_found") {
        await this.publishToDeadLetter(message, payload, retryCount, {
          reason: result.reason,
          error: "source_not_found",
        });
        this.metricsService.increment("document_ingestion_consumer_dlq_total");
      } else if (result.status === "skipped") {
        this.metricsService.increment("document_ingestion_consumer_skipped_total");
      }

      this.channel.ack(message);
    } catch (error) {
      this.metricsService.increment("document_ingestion_consumer_message_error_total");
      const nextRetryCount = retryCount + 1;
      const maxAttempts =
        this.configService.get<number>("rabbitmq.maxAttempts", 3) ?? 3;
      const shouldDeadLetter = !payload || nextRetryCount >= maxAttempts;

      this.logger.error(
        "Failed to handle document ingestion message",
        error instanceof Error ? error.stack : undefined,
        DocumentIngestionConsumerService.name,
        {
          sourceId: payload?.sourceId,
          tenantId: payload?.tenantId,
          eventId: payload?.eventId,
          correlationId: payload?.correlationId,
          retryCount,
          nextRetryCount,
          maxAttempts,
          shouldDeadLetter,
        },
      );

      try {
        if (!payload) {
          await this.publishToDeadLetter(message, null, retryCount, {
            reason: "invalid_payload",
            error:
              error instanceof Error ? error.message : "invalid_document_event",
          });
          this.metricsService.increment("document_ingestion_consumer_dlq_total");
          this.channel.ack(message);
          return;
        }

        if (shouldDeadLetter) {
          await this.ingestionInternalClient.failIngestion({
            sourceId: payload.sourceId,
            reason:
              error instanceof Error
                ? error.message
                : "document_ingestion_failed",
            eventId: payload.eventId,
            correlationId: payload.correlationId,
            retryCount: nextRetryCount,
          });
          await this.publishToDeadLetter(message, payload, nextRetryCount, {
            reason: "retry_exhausted",
            error:
              error instanceof Error
                ? error.message
                : "document_ingestion_failed",
          });
          this.metricsService.increment("document_ingestion_consumer_dlq_total");
        } else {
          await this.ingestionInternalClient.updateIngestionStatus({
            sourceId: payload.sourceId,
            status: "PENDING",
            errorMessage:
              error instanceof Error
                ? error.message
                : "document_ingestion_retry_scheduled",
            eventId: payload.eventId,
            correlationId: payload.correlationId,
            retryCount: nextRetryCount,
          });
          await this.publishToRetry(payload, nextRetryCount);
          this.metricsService.increment("document_ingestion_consumer_retry_total");
        }

        this.channel.ack(message);
      } catch (publishError) {
        this.logger.error(
          "Failed to republish document ingestion message for retry or DLQ",
          publishError instanceof Error ? publishError.stack : undefined,
          DocumentIngestionConsumerService.name,
          {
            sourceId: payload?.sourceId,
            eventId: payload?.eventId,
            correlationId: payload?.correlationId,
            retryCount,
          },
        );
        this.channel.nack(message, false, true);
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  private parseMessage(message: Message): DocumentIngestionRequestedEvent {
    const parsed = JSON.parse(
      message.content.toString("utf-8"),
    ) as Partial<DocumentIngestionRequestedEvent>;

    if (
      typeof parsed.sourceId !== "number" ||
      typeof parsed.tenantId !== "string" ||
      typeof parsed.filename !== "string" ||
      typeof parsed.mimeType !== "string" ||
      typeof parsed.storageKey !== "string" ||
      typeof parsed.storageUrl !== "string" ||
      typeof parsed.fileContentBase64 !== "string" ||
      typeof parsed.uploadedAt !== "string"
    ) {
      throw new Error("document_ingestion_invalid_payload");
    }

    return {
      eventId:
        parsed.eventId ??
        message.properties.messageId ??
        `ingestion-${randomUUID()}`,
      correlationId:
        parsed.correlationId ??
        message.properties.correlationId ??
        randomUUID(),
      sourceId: parsed.sourceId,
      tenantId: parsed.tenantId,
      sourceChannel: parsed.sourceChannel,
      conversationId: parsed.conversationId,
      filename: parsed.filename,
      mimeType: parsed.mimeType,
      storageKey: parsed.storageKey,
      storageUrl: parsed.storageUrl,
      fileContentBase64: parsed.fileContentBase64,
      chunkSize: parsed.chunkSize,
      chunkOverlap: parsed.chunkOverlap,
      metadata: parsed.metadata,
      requestedAt: parsed.requestedAt,
      uploadedAt: parsed.uploadedAt,
    };
  }

  private getRetryCount(message: Message): number {
    const rawRetryCount = message.properties.headers?.["x-retry-count"];
    const parsed =
      typeof rawRetryCount === "number"
        ? rawRetryCount
        : Number.parseInt(String(rawRetryCount ?? "0"), 10);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  private async publishToRetry(
    payload: DocumentIngestionRequestedEvent,
    retryCount: number,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error("document_ingestion_retry_channel_unavailable");
    }

    this.channel.publish(
      this.configService.getOrThrow<string>("rabbitmq.retryExchange"),
      this.configService.getOrThrow<string>("rabbitmq.retryRoutingKey"),
      Buffer.from(JSON.stringify(payload)),
      {
        persistent: true,
        contentType: "application/json",
        contentEncoding: "utf-8",
        messageId: payload.eventId,
        correlationId: payload.correlationId,
        type: "document.ingestion.requested.retry",
        headers: {
          "x-event-id": payload.eventId,
          "x-correlation-id": payload.correlationId,
          "x-retry-count": retryCount,
          "x-source-id": payload.sourceId,
        },
      },
    );
    await this.channel.waitForConfirms();
  }

  private async publishToDeadLetter(
    message: Message,
    payload: DocumentIngestionRequestedEvent | null,
    retryCount: number,
    context: {
      reason: string;
      error: string;
    },
  ): Promise<void> {
    if (!this.channel) {
      throw new Error("document_ingestion_dlq_channel_unavailable");
    }

    const eventId =
      payload?.eventId ??
      message.properties.messageId ??
      `ingestion-dlq-${randomUUID()}`;
    const correlationId =
      payload?.correlationId ??
      message.properties.correlationId ??
      randomUUID();

    this.channel.publish(
      this.configService.getOrThrow<string>("rabbitmq.deadLetterExchange"),
      this.configService.getOrThrow<string>("rabbitmq.deadLetterRoutingKey"),
      message.content,
      {
        persistent: true,
        contentType: message.properties.contentType || "application/json",
        contentEncoding: message.properties.contentEncoding || "utf-8",
        messageId: eventId,
        correlationId,
        type: "document.ingestion.failed",
        headers: {
          ...(message.properties.headers ?? {}),
          "x-event-id": eventId,
          "x-correlation-id": correlationId,
          "x-retry-count": retryCount,
          "x-source-id": payload?.sourceId,
          "x-failure-reason": context.reason,
          "x-failure-message": context.error,
        },
      },
    );
    await this.channel.waitForConfirms();
  }

  private async assertTopology(channel: ConfirmChannel): Promise<void> {
    const exchange = this.configService.getOrThrow<string>("rabbitmq.exchange");
    const routingKey =
      this.configService.getOrThrow<string>("rabbitmq.routingKey");
    const queue = this.configService.getOrThrow<string>("rabbitmq.queue");
    const retryExchange =
      this.configService.getOrThrow<string>("rabbitmq.retryExchange");
    const retryQueue =
      this.configService.getOrThrow<string>("rabbitmq.retryQueue");
    const retryRoutingKey =
      this.configService.getOrThrow<string>("rabbitmq.retryRoutingKey");
    const deadLetterExchange = this.configService.getOrThrow<string>(
      "rabbitmq.deadLetterExchange",
    );
    const deadLetterQueue = this.configService.getOrThrow<string>(
      "rabbitmq.deadLetterQueue",
    );
    const deadLetterRoutingKey = this.configService.getOrThrow<string>(
      "rabbitmq.deadLetterRoutingKey",
    );
    const retryDelayMs =
      this.configService.get<number>("rabbitmq.retryDelayMs", 30_000) ?? 30_000;

    await channel.assertExchange(exchange, "direct", { durable: true });
    await channel.assertExchange(retryExchange, "direct", { durable: true });
    await channel.assertExchange(deadLetterExchange, "direct", { durable: true });

    await channel.assertQueue(queue, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": deadLetterExchange,
        "x-dead-letter-routing-key": deadLetterRoutingKey,
      },
    });
    await channel.bindQueue(queue, exchange, routingKey);

    await channel.assertQueue(retryQueue, {
      durable: true,
      arguments: {
        "x-message-ttl": retryDelayMs,
        "x-dead-letter-exchange": exchange,
        "x-dead-letter-routing-key": routingKey,
      },
    });
    await channel.bindQueue(retryQueue, retryExchange, retryRoutingKey);

    await channel.assertQueue(deadLetterQueue, { durable: true });
    await channel.bindQueue(
      deadLetterQueue,
      deadLetterExchange,
      deadLetterRoutingKey,
    );
  }
}
