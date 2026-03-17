import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { DocumentIngestionRequestedEvent } from "@rag-platform/contracts";
import { connect, type Channel, type ChannelModel } from "amqplib";
import { PinoLogger } from "nestjs-pino";
import { TracingService } from "../observability/services/tracing.service";

@Injectable()
export class DocumentIngestionPublisherService implements OnModuleDestroy {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

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
        const queue = this.configService.getOrThrow<string>("rabbitmq.queue");

        this.logger.info(
          {
            sourceId: payload.sourceId,
            tenantId: payload.tenantId,
            queue,
          },
          "Publishing document ingestion request",
        );

        channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
          persistent: true,
          contentType: "application/json",
          messageId: `document-ingestion:${String(payload.sourceId)}`,
          type: "document.ingestion.requested",
        });
      },
      {
        attributes: {
          "messaging.system": "rabbitmq",
          "messaging.destination": this.configService.get<string>(
            "rabbitmq.queue",
            "document.ingestion.requested",
          ),
        },
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  private async getChannel(): Promise<Channel> {
    if (this.channel) {
      return this.channel;
    }

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

    return this.channel;
  }
}
