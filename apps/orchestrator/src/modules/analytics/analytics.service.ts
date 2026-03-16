import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppLoggerService } from "@rag-platform/observability";
import { createClient, type RedisClientType } from "redis";
import type { AnalyticsPublishPayload } from "./interfaces";

@Injectable()
export class AnalyticsPublisherService
  implements OnModuleInit, OnModuleDestroy
{
  private publisher?: RedisClientType;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.publisher = createClient({
      socket: {
        host: this.configService.get<string>("queue.redis.host", "localhost"),
        port: this.configService.get<number>("queue.redis.port", 6379) ?? 6379,
      },
      password:
        this.configService.get<string>("queue.redis.password") || undefined,
      database: this.configService.get<number>("queue.redis.db", 0) ?? 0,
    });

    await this.publisher.connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.publisher?.isOpen) {
      await this.publisher.quit();
    }
  }

  async publish(payload: AnalyticsPublishPayload): Promise<void> {
    if (!this.publisher?.isOpen) {
      return;
    }

    await this.publisher.publish("analytics-events", JSON.stringify(payload));
    this.logger.debug(
      "Analytics event published",
      AnalyticsPublisherService.name,
      {
        eventType: payload.eventType,
        channel: payload.channel,
        agent: payload.agent,
        flow: payload.flow,
      },
    );
  }
}
