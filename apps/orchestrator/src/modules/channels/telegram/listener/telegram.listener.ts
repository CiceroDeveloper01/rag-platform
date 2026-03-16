import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Channel } from "@rag-platform/contracts";
import { AppLoggerService } from "@rag-platform/observability";
import { BaseChannelListener } from "../../core/interfaces/base-channel.listener";
import { InboundMessagesQueueService } from "../../../queue/inbound-messages.queue";
import { InboundMessagePayload } from "../../../queue/inbound-message.types";
import { TelegramPollingService } from "../polling/telegram.polling.service";
import { AgentTracePublisherService } from "../../../agent-trace/agent-trace.publisher";
import {
  TELEGRAM_MESSAGES_QUEUED_TOTAL,
  MetricsService,
} from "@rag-platform/observability";

@Injectable()
export class TelegramListener extends BaseChannelListener {
  readonly channel = Channel.TELEGRAM;

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramPollingService: TelegramPollingService,
    private readonly metricsService: MetricsService,
    private readonly agentTracePublisherService: AgentTracePublisherService,
    logger: AppLoggerService,
    inboundMessagesQueueService: InboundMessagesQueueService,
  ) {
    super(logger, inboundMessagesQueueService, TelegramListener.name);
  }

  async start(): Promise<void> {
    const enabled = this.configService.get<boolean>(
      "listeners.telegram.enabled",
      true,
    );
    if (!enabled) {
      this.logDisabled();
      return;
    }

    const mode =
      this.configService.get<string>("listeners.telegram.mode", "polling") ??
      "polling";
    const botToken = this.configService.get<string>(
      "listeners.telegram.botToken",
    );
    const botUsername = this.configService.get<string>(
      "listeners.telegram.botUsername",
    );

    if (!botToken) {
      throw new Error(
        "Telegram listener is enabled but TELEGRAM_BOT_TOKEN is missing",
      );
    }

    if (!botUsername) {
      throw new Error(
        "Telegram listener is enabled but TELEGRAM_BOT_USERNAME is missing",
      );
    }

    if (mode !== "polling") {
      this.logReady({ mode, implemented: false });
      return;
    }

    this.logReady({ mode });
    await this.telegramPollingService.start(async (payload) => {
      await this.publishInboundMessage(payload);
      this.metricsService.increment(TELEGRAM_MESSAGES_QUEUED_TOTAL);
      await this.agentTracePublisherService.publish({
        traceId: `telegram:${payload.externalMessageId}`,
        timestamp: new Date().toISOString(),
        step: "telegram_message_queued",
        data: {
          externalMessageId: payload.externalMessageId,
          conversationId: payload.conversationId,
          tenantId: payload.metadata?.tenantId,
        },
      });
    });
  }

  async receive(event: InboundMessagePayload): Promise<void> {
    await this.publishInboundMessage(event);
  }
}
