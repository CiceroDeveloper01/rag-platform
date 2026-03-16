import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Channel } from "@rag-platform/contracts";
import {
  ChannelOutboundMessage,
  ChannelOutboundService,
} from "./channel-outbound.interface";
import { ChannelHttpClient } from "./channel-http.client";
import { TelegramSendMessageResponse } from "./telegram.types";

@Injectable()
export class TelegramOutboundService implements ChannelOutboundService {
  readonly channel = Channel.TELEGRAM;

  constructor(
    private readonly configService: ConfigService,
    private readonly channelHttpClient: ChannelHttpClient,
  ) {}

  async sendMessage(
    chatIdOrMessage: string | number | ChannelOutboundMessage,
    text?: string,
  ): Promise<void> {
    const outboundMessage =
      typeof chatIdOrMessage === "object"
        ? chatIdOrMessage
        : {
            recipientId: String(chatIdOrMessage),
            text: text ?? "",
          };
    const botToken = this.configService.get<string>(
      "listeners.telegram.botToken",
    );
    const apiBaseUrl =
      this.configService.get<string>(
        "listeners.telegram.apiBaseUrl",
        "https://api.telegram.org",
      ) ?? "https://api.telegram.org";

    const payload =
      await this.channelHttpClient.requestJson<TelegramSendMessageResponse>({
        channel: this.channel,
        operation: "outbound.sendMessage",
        method: "POST",
        url: new URL(`/bot${botToken}/sendMessage`, apiBaseUrl).toString(),
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          chat_id: outboundMessage.recipientId,
          text: outboundMessage.text,
        }),
        timeoutMs:
          this.configService.get<number>(
            "listeners.telegram.timeoutMs",
            10_000,
          ) ?? 10_000,
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
        idempotent: false,
      });

    if (!payload.ok) {
      throw new Error("Telegram sendMessage returned ok=false");
    }
  }
}
