import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppLoggerService } from "@rag-platform/observability";
import { createClient, type RedisClientType } from "redis";

export interface AgentTracePublishPayload {
  traceId: string;
  timestamp: string;
  step:
    | "agent_trace_started"
    | "agent_routed"
    | "rag_retrieval"
    | "tool_called"
    | "response_generated"
    | "evaluation_completed"
    | "telegram_update_received"
    | "telegram_message_queued"
    | "telegram_job_processing"
    | "telegram_agent_execution"
    | "telegram_response_sent"
    | "evaluation_skipped"
    | "outbound_delivery_skipped";
  data: Record<string, unknown>;
}

@Injectable()
export class AgentTracePublisherService
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

  async publish(payload: AgentTracePublishPayload): Promise<void> {
    if (!this.publisher?.isOpen) {
      return;
    }

    await this.publisher.publish("agent-trace-events", JSON.stringify(payload));
    this.logger.debug(
      "Agent trace event published",
      AgentTracePublisherService.name,
      {
        traceId: payload.traceId,
        step: payload.step,
      },
    );
  }
}
