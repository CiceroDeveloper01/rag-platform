import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  assertMessagingBindingTopology,
  buildMessagingPublishProperties,
  createMessagingEnvelope,
  isMessagingEnvelope,
  type DocumentIngestionRequestedEvent,
  type MessagingEnvelope,
} from "@rag-platform/contracts";
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
      this.metricsService.increment("rabbitmq_messages_consumed_total", {
        queue:
          this.configService.get<string>("rabbitmq.queue") ??
          "document.ingestion.requested",
        event_type: "document.ingestion.requested",
      });
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
        this.metricsService.increment("rabbitmq_messages_dead_lettered_total", {
          queue:
            this.configService.get<string>("rabbitmq.deadLetterQueue") ??
            "document.ingestion.requested.dlq",
          event_type: "document.ingestion.failed",
        });
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
          this.metricsService.increment("rabbitmq_messages_dead_lettered_total", {
            queue:
              this.configService.get<string>("rabbitmq.deadLetterQueue") ??
              "document.ingestion.requested.dlq",
            event_type: "document.ingestion.failed",
          });
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
          this.metricsService.increment("rabbitmq_messages_dead_lettered_total", {
            queue:
              this.configService.get<string>("rabbitmq.deadLetterQueue") ??
              "document.ingestion.requested.dlq",
            event_type: "document.ingestion.failed",
          });
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
          this.metricsService.increment("rabbitmq_messages_republished_total", {
            exchange:
              this.configService.get<string>("rabbitmq.retryExchange") ??
              "documents.ingestion.retry",
            event_type: "document.ingestion.requested.retry",
          });
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
    ) as Partial<DocumentIngestionRequestedEvent> | MessagingEnvelope<unknown>;
    const event = (
      isMessagingEnvelope<DocumentIngestionRequestedEvent>(parsed)
        ? parsed.payload
        : parsed
    ) as Partial<DocumentIngestionRequestedEvent>;

    if (
      typeof event.sourceId !== "number" ||
      typeof event.tenantId !== "string" ||
      typeof event.filename !== "string" ||
      typeof event.mimeType !== "string" ||
      typeof event.storageKey !== "string" ||
      typeof event.storageUrl !== "string" ||
      typeof event.fileContentBase64 !== "string" ||
      typeof event.uploadedAt !== "string"
    ) {
      throw new Error("document_ingestion_invalid_payload");
    }

    return {
      eventId:
        event.eventId ??
        message.properties.messageId ??
        `ingestion-${randomUUID()}`,
      correlationId:
        event.correlationId ??
        message.properties.correlationId ??
        randomUUID(),
      sourceId: event.sourceId,
      tenantId: event.tenantId,
      sourceChannel: event.sourceChannel,
      conversationId: event.conversationId,
      filename: event.filename,
      mimeType: event.mimeType,
      storageKey: event.storageKey,
      storageUrl: event.storageUrl,
      fileContentBase64: event.fileContentBase64,
      chunkSize: event.chunkSize,
      chunkOverlap: event.chunkOverlap,
      metadata: event.metadata,
      requestedAt: event.requestedAt,
      uploadedAt: event.uploadedAt,
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

    const envelope = createMessagingEnvelope({
      messageId: payload.eventId,
      correlationId: payload.correlationId,
      causationId: payload.eventId,
      tenantId: payload.tenantId,
      eventType: "document.ingestion.requested.retry",
      source: "orchestrator.document-ingestion.consumer",
      payload,
      metadata: {
        retryCount,
        sourceId: payload.sourceId,
      },
    });

    this.channel.publish(
      this.configService.getOrThrow<string>("rabbitmq.retryExchange"),
      this.configService.getOrThrow<string>("rabbitmq.retryRoutingKey"),
      Buffer.from(JSON.stringify(envelope)),
      buildMessagingPublishProperties(envelope, {
        headers: {
          "x-event-id": payload.eventId,
          "x-retry-count": retryCount,
          "x-source-id": payload.sourceId,
        },
      }),
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
    const content = this.buildDeadLetterMessageContent(
      message,
      payload,
      eventId,
      correlationId,
      retryCount,
      context,
    );

    this.channel.publish(
      this.configService.getOrThrow<string>("rabbitmq.deadLetterExchange"),
      this.configService.getOrThrow<string>("rabbitmq.deadLetterRoutingKey"),
      Buffer.from(JSON.stringify(content)),
      buildMessagingPublishProperties(content, {
        contentType: message.properties.contentType || "application/json",
        contentEncoding: message.properties.contentEncoding || "utf-8",
        headers: {
          ...(message.properties.headers ?? {}),
          "x-event-id": eventId,
          "x-retry-count": retryCount,
          "x-source-id": payload?.sourceId,
          "x-failure-reason": context.reason,
          "x-failure-message": context.error,
        },
      }),
    );
    await this.channel.waitForConfirms();
  }

  private async assertTopology(channel: ConfirmChannel): Promise<void> {
    const retryDelayMs =
      this.configService.get<number>("rabbitmq.retryDelayMs", 30_000) ?? 30_000;

    await assertMessagingBindingTopology(
      channel,
      {
        exchange: this.configService.getOrThrow<string>("rabbitmq.exchange"),
        queue: this.configService.getOrThrow<string>("rabbitmq.queue"),
        routingKey: this.configService.getOrThrow<string>("rabbitmq.routingKey"),
        retryExchange:
          this.configService.getOrThrow<string>("rabbitmq.retryExchange"),
        retryQueue: this.configService.getOrThrow<string>("rabbitmq.retryQueue"),
        retryRoutingKey: this.configService.getOrThrow<string>(
          "rabbitmq.retryRoutingKey",
        ),
        deadLetterExchange: this.configService.getOrThrow<string>(
          "rabbitmq.deadLetterExchange",
        ),
        deadLetterQueue: this.configService.getOrThrow<string>(
          "rabbitmq.deadLetterQueue",
        ),
        deadLetterRoutingKey: this.configService.getOrThrow<string>(
          "rabbitmq.deadLetterRoutingKey",
        ),
      },
      retryDelayMs,
    );
  }

  private buildDeadLetterMessageContent(
    message: Message,
    payload: DocumentIngestionRequestedEvent | null,
    eventId: string,
    correlationId: string,
    retryCount: number,
    context: {
      reason: string;
      error: string;
    },
  ): MessagingEnvelope<unknown> {
    const parsed = this.tryParseMessageContent(message.content);

    if (isMessagingEnvelope(parsed)) {
      return createMessagingEnvelope({
        messageId: eventId,
        correlationId,
        causationId:
          parsed.causationId ??
          parsed.messageId ??
          message.properties.messageId ??
          eventId,
        tenantId: payload?.tenantId ?? parsed.tenantId ?? null,
        eventType: "document.ingestion.failed",
        source: "orchestrator.document-ingestion.consumer",
        payload: parsed.payload,
        metadata: {
          ...(parsed.metadata ?? {}),
          retryCount,
          failureReason: context.reason,
          failureMessage: context.error,
          sourceId: payload?.sourceId,
        },
      });
    }

    return createMessagingEnvelope({
      messageId: eventId,
      correlationId,
      causationId: message.properties.messageId ?? eventId,
      tenantId: payload?.tenantId ?? null,
      eventType: "document.ingestion.failed",
      source: "orchestrator.document-ingestion.consumer",
      payload: parsed,
      metadata: {
        retryCount,
        failureReason: context.reason,
        failureMessage: context.error,
        sourceId: payload?.sourceId,
      },
    });
  }

  private tryParseMessageContent(content: Buffer): unknown {
    try {
      return JSON.parse(content.toString("utf-8")) as unknown;
    } catch {
      return {
        rawContent: content.toString("utf-8"),
      };
    }
  }
}
