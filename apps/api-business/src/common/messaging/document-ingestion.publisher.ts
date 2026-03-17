import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { DocumentIngestionRequestedEvent } from "@rag-platform/contracts";
import { connect, type ChannelModel, type ConfirmChannel } from "amqplib";
import { PinoLogger } from "nestjs-pino";
import { TracingService } from "../observability/services/tracing.service";

@Injectable()
export class DocumentIngestionPublisherService implements OnModuleDestroy {
  private connection: ChannelModel | null = null;
  private channel: ConfirmChannel | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly tracingService: TracingService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DocumentIngestionPublisherService.name);
  }

  async publish(payload: DocumentIngestionRequestedEvent): Promise<void> {
    await this.tracingService.runInSpan(
      "documents.ingestion.publish",
      async () => {
        const channel = await this.getChannel();
        const exchange =
          this.configService.getOrThrow<string>("rabbitmq.exchange");
        const routingKey =
          this.configService.getOrThrow<string>("rabbitmq.routingKey");

        this.logger.info(
          {
            sourceId: payload.sourceId,
            tenantId: payload.tenantId,
            eventId: payload.eventId,
            correlationId: payload.correlationId,
            exchange,
            routingKey,
          },
          "Publishing document ingestion request",
        );

        channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), {
          persistent: true,
          contentType: "application/json",
          contentEncoding: "utf-8",
          messageId: payload.eventId,
          correlationId: payload.correlationId,
          type: "document.ingestion.requested",
          headers: {
            "x-event-id": payload.eventId,
            "x-correlation-id": payload.correlationId,
            "x-retry-count": 0,
            "x-source-id": payload.sourceId,
          },
        });
        await channel.waitForConfirms();
      },
      {
        attributes: {
          "messaging.system": "rabbitmq",
          "messaging.destination":
            this.configService.get<string>("rabbitmq.exchange") ??
            "documents.ingestion",
          "messaging.destination_kind": "exchange",
        },
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  private async getChannel(): Promise<ConfirmChannel> {
    if (this.channel) {
      return this.channel;
    }

    this.connection = await connect(
      this.configService.getOrThrow<string>("rabbitmq.url"),
    );
    this.channel = await this.connection.createConfirmChannel();
    await this.assertTopology(this.channel);

    return this.channel;
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
