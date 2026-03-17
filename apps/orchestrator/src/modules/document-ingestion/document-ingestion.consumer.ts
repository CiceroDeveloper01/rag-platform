import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { DocumentIngestionRequestedEvent } from "@rag-platform/contracts";
import { AppLoggerService, MetricsService } from "@rag-platform/observability";
import { connect, type Channel, type ChannelModel, type ConsumeMessage } from "amqplib";
import { DocumentIngestionWorkerService } from "./document-ingestion.worker";

@Injectable()
export class DocumentIngestionConsumerService
  implements OnModuleInit, OnModuleDestroy
{
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
    private readonly metricsService: MetricsService,
    private readonly workerService: DocumentIngestionWorkerService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.connection = await connect(
      this.configService.getOrThrow<string>("rabbitmq.url"),
    );
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(
      this.configService.getOrThrow<string>("rabbitmq.queue"),
      {
        durable: true,
      },
    );
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

    try {
      const payload = JSON.parse(
        message.content.toString("utf-8"),
      ) as DocumentIngestionRequestedEvent;

      this.metricsService.increment("document_ingestion_consumer_received_total");
      this.logger.log(
        "Consumed document ingestion request",
        DocumentIngestionConsumerService.name,
        {
          sourceId: payload.sourceId,
          tenantId: payload.tenantId,
          queue: this.configService.get<string>(
            "rabbitmq.queue",
            "document.ingestion.requested",
          ),
        },
      );

      await this.workerService.process(payload);
      this.channel.ack(message);
    } catch (error) {
      this.metricsService.increment("document_ingestion_consumer_message_error_total");
      this.logger.error(
        "Failed to handle document ingestion message",
        error instanceof Error ? error.stack : undefined,
        DocumentIngestionConsumerService.name,
      );
      this.channel.ack(message);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }
}
