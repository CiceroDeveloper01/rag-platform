import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ACTIVE_MESSAGING_TOPOLOGY,
  assertMessagingBindingTopology,
  buildMessagingPublishProperties,
  createMessagingEnvelope,
  type DocumentIngestionRequestedEvent,
} from "@rag-platform/contracts";
import { connect, type ChannelModel, type ConfirmChannel } from "amqplib";
import { PinoLogger } from "nestjs-pino";
import { ObservabilityMetricsService } from "../observability/services/metrics.service";
import { TracingService } from "../observability/services/tracing.service";

@Injectable()
export class DocumentIngestionPublisherService implements OnModuleDestroy {
  private connection: ChannelModel | null = null;
  private channel: ConfirmChannel | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly tracingService: TracingService,
    private readonly metricsService: ObservabilityMetricsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DocumentIngestionPublisherService.name);
  }

  async publish(payload: DocumentIngestionRequestedEvent): Promise<void> {
    const activeIngestionTopology =
      ACTIVE_MESSAGING_TOPOLOGY.ingestion.documentRequested;
    const envelope = createMessagingEnvelope({
      messageId: payload.eventId,
      correlationId: payload.correlationId,
      causationId: payload.eventId,
      tenantId: payload.tenantId,
      eventType: "document.ingestion.requested",
      source: "api-business.document-ingestion.publisher",
      payload,
      metadata: {
        sourceId: payload.sourceId,
        sourceChannel: payload.sourceChannel,
        conversationId: payload.conversationId,
      },
    });

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
            messageId: envelope.messageId,
            correlationId: payload.correlationId,
            eventType: envelope.eventType,
            exchange,
            routingKey,
          },
          "Publishing document ingestion request",
        );

        channel.publish(
          exchange,
          routingKey,
          Buffer.from(JSON.stringify(envelope)),
          buildMessagingPublishProperties(envelope, {
            headers: {
              "x-event-id": payload.eventId,
              "x-retry-count": 0,
              "x-source-id": payload.sourceId,
            },
          }),
        );
        await channel.waitForConfirms();
        this.metricsService.incrementCounter(
          "rabbitmq_messages_published_total",
          {
            exchange,
            routing_key: routingKey,
            event_type: envelope.eventType,
            source: envelope.source,
          },
          1,
          "Total number of RabbitMQ messages published by api-business",
        );
      },
      {
        attributes: {
          "messaging.system": "rabbitmq",
          "messaging.destination":
            this.configService.get<string>("rabbitmq.exchange") ??
            activeIngestionTopology.exchange,
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
}
