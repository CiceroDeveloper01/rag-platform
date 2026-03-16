import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AppLoggerService,
  MetricsService,
  TELEGRAM_UPDATES_RECEIVED_TOTAL,
  TracingService,
} from "@rag-platform/observability";
import { Channel } from "@rag-platform/contracts";
import { InboundMessagePayload } from "../queue/inbound-message.types";
import { AgentTracePublisherService } from "../agent-trace/agent-trace.publisher";
import { ChannelHttpClient } from "./channel-http.client";
import { TelegramInboundAdapter } from "./telegram.inbound.adapter";
import { TelegramGetUpdatesResponse } from "./telegram.types";

type PublishInboundMessage = (payload: InboundMessagePayload) => Promise<void>;

@Injectable()
export class TelegramPollingService implements OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private lastUpdateId?: number;
  private started = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
    private readonly metricsService: MetricsService,
    private readonly tracingService: TracingService,
    private readonly agentTracePublisherService: AgentTracePublisherService,
    private readonly channelHttpClient: ChannelHttpClient,
    private readonly telegramInboundAdapter: TelegramInboundAdapter,
  ) {}

  async start(publishInboundMessage: PublishInboundMessage): Promise<void> {
    if (this.started) {
      this.logger.debug(
        "Telegram polling already started",
        TelegramPollingService.name,
      );
      return;
    }

    this.started = true;
    await this.pollOnce(publishInboundMessage);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  private async pollOnce(
    publishInboundMessage: PublishInboundMessage,
  ): Promise<void> {
    try {
      const updates = await this.fetchUpdates();
      for (const update of updates) {
        const trace = this.tracingService.startSpan("telegram_update_received");
        this.lastUpdateId = Math.max(
          this.lastUpdateId ?? update.update_id,
          update.update_id,
        );
        this.metricsService.increment(TELEGRAM_UPDATES_RECEIVED_TOTAL);
        const payload = this.telegramInboundAdapter.toInboundMessage(update);
        if (!payload) {
          this.tracingService.endSpan(trace);
          continue;
        }

        await this.agentTracePublisherService.publish({
          traceId: `telegram:${payload.externalMessageId}`,
          timestamp: new Date().toISOString(),
          step: "telegram_update_received",
          data: {
            updateId: update.update_id,
            externalMessageId: payload.externalMessageId,
            conversationId: payload.conversationId,
          },
        });

        await publishInboundMessage(payload);
        this.tracingService.endSpan(trace);
      }
    } catch (error) {
      this.logger.error(
        "Telegram polling failed",
        error instanceof Error ? error.stack : undefined,
        TelegramPollingService.name,
        {
          lastUpdateId: this.lastUpdateId,
        },
      );
    } finally {
      const intervalMs =
        this.configService.get<number>(
          "listeners.telegram.pollingIntervalMs",
          10_000,
        ) ?? 10_000;

      this.timer = setTimeout(() => {
        void this.pollOnce(publishInboundMessage);
      }, intervalMs);
    }
  }

  private async fetchUpdates() {
    const botToken = this.configService.get<string>(
      "listeners.telegram.botToken",
    );
    const apiBaseUrl =
      this.configService.get<string>(
        "listeners.telegram.apiBaseUrl",
        "https://api.telegram.org",
      ) ?? "https://api.telegram.org";
    const timeoutMs = Math.min(
      this.configService.get<number>(
        "listeners.telegram.pollingIntervalMs",
        10_000,
      ) ?? 10_000,
      10_000,
    );

    const url = new URL(`/bot${botToken}/getUpdates`, apiBaseUrl);
    if (typeof this.lastUpdateId === "number") {
      url.searchParams.set("offset", String(this.lastUpdateId + 1));
    }

    const payload =
      await this.channelHttpClient.requestJson<TelegramGetUpdatesResponse>({
        channel: Channel.TELEGRAM,
        operation: "polling.getUpdates",
        method: "GET",
        url: url.toString(),
        timeoutMs,
        retryEnabled:
          this.configService.get<boolean>(
            "listeners.telegram.retryEnabled",
            true,
          ) ?? true,
        retryMaxAttempts:
          this.configService.get<number>(
            "listeners.telegram.retryMaxAttempts",
            3,
          ) ?? 3,
        retryInitialDelayMs:
          this.configService.get<number>(
            "listeners.telegram.retryInitialDelayMs",
            250,
          ) ?? 250,
        retryMaxDelayMs:
          this.configService.get<number>(
            "listeners.telegram.retryMaxDelayMs",
            2_000,
          ) ?? 2_000,
        idempotent: true,
      });

    if (!payload.ok) {
      throw new Error("Telegram getUpdates returned ok=false");
    }

    return payload.result;
  }
}
