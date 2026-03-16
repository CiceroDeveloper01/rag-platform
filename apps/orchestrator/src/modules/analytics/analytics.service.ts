import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppLoggerService } from "@rag-platform/observability";
import { createClient, type RedisClientType } from "redis";
import { Channel } from "@rag-platform/contracts";

interface AnalyticsPublishPayload {
  eventType:
    | "analytics.message.received"
    | "analytics.agent.selected"
    | "analytics.flow.executed"
    | "analytics.agent.quality"
    | "analytics.user.feedback"
    | "analytics.ai.cost"
    | "analytics.tenant.usage";
  timestamp: string;
  channel?: Channel;
  language?: "pt" | "en" | "es";
  agent?: string;
  flow?: string;
  tenantId?: string;
  model?: string;
  keywords?: string[];
  averageQualityScore?: number;
  failureRate?: number;
  userSatisfaction?: number;
  averageRating?: number;
  totalCost?: number;
  tokensInput?: number;
  tokensOutput?: number;
  costByAgent?: Array<{
    agentName: string;
    cost: number;
    tokensInput: number;
    tokensOutput: number;
  }>;
  costByTenant?: Array<{
    tenantId: string;
    cost: number;
    tokensInput: number;
    tokensOutput: number;
  }>;
}

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
