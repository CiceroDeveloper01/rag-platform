import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Channel } from "@rag-platform/contracts";
import { ConfigService } from "@nestjs/config";
import { JobsOptions, Queue } from "bullmq";
import {
  INBOUND_MESSAGES_QUEUE,
  EMAIL_RECEIVED_JOB,
  TELEGRAM_RECEIVED_JOB,
  WHATSAPP_RECEIVED_JOB,
} from "./queue.constants";
import { InboundMessagePayload } from "./inbound-message.types";

const CHANNEL_JOB_MAP: Record<InboundMessagePayload["channel"], string> = {
  [Channel.EMAIL]: EMAIL_RECEIVED_JOB,
  [Channel.TELEGRAM]: TELEGRAM_RECEIVED_JOB,
  [Channel.WHATSAPP]: WHATSAPP_RECEIVED_JOB,
};

@Injectable()
export class InboundMessagesQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(InboundMessagesQueueService.name);
  private readonly queue: Queue<InboundMessagePayload>;
  private readonly defaultJobOptions: JobsOptions;

  constructor(private readonly configService: ConfigService) {
    this.queue = new Queue<InboundMessagePayload>(
      this.configService.get<string>(
        "queue.inbound.name",
        INBOUND_MESSAGES_QUEUE,
      ) ?? INBOUND_MESSAGES_QUEUE,
      {
        connection: {
          host: this.configService.get<string>("queue.redis.host", "localhost"),
          port:
            this.configService.get<number>("queue.redis.port", 6379) ?? 6379,
          db: this.configService.get<number>("queue.redis.db", 0) ?? 0,
          password:
            this.configService.get<string>("queue.redis.password") || undefined,
        },
      },
    );

    this.defaultJobOptions = {
      attempts:
        this.configService.get<number>("queue.inbound.attempts", 3) ?? 3,
      backoff: {
        type: "exponential",
        delay:
          this.configService.get<number>("queue.inbound.backoffMs", 1000) ??
          1000,
      },
      removeOnComplete: {
        age:
          this.configService.get<number>(
            "queue.inbound.completedRetentionSeconds",
            86_400,
          ) ?? 86_400,
        count: 1000,
      },
      removeOnFail: {
        age:
          this.configService.get<number>(
            "queue.inbound.failedRetentionSeconds",
            604_800,
          ) ?? 604_800,
        count: 1000,
      },
    };
  }

  async enqueueReceivedMessage(payload: InboundMessagePayload): Promise<void> {
    await this.queue.add(CHANNEL_JOB_MAP[payload.channel], payload, {
      ...this.defaultJobOptions,
      jobId: `${payload.channel}:${payload.externalMessageId}`,
    });

    this.logger.log(
      `Queued inbound message ${payload.externalMessageId} from ${payload.channel}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
