import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Channel } from "@rag-platform/contracts";
import {
  ChannelOutboundMessage,
  ChannelOutboundService,
} from "./channel-outbound.interface";
import { ChannelHttpClient } from "./channel-http.client";

@Injectable()
export class WhatsAppOutboundService implements ChannelOutboundService {
  readonly channel = Channel.WHATSAPP;

  constructor(
    private readonly configService: ConfigService,
    private readonly channelHttpClient: ChannelHttpClient,
  ) {}

  async sendMessage(message: ChannelOutboundMessage): Promise<void> {
    const apiBaseUrl = this.configService.get<string>(
      "listeners.whatsapp.apiBaseUrl",
    );
    const outboundPath =
      this.configService.get<string>("listeners.whatsapp.outboundPath") ??
      "/messages";

    if (!apiBaseUrl) {
      throw new Error("WhatsApp outbound API is not configured");
    }

    const token = this.configService.get<string>("listeners.whatsapp.apiToken");

    await this.channelHttpClient.requestJson({
      channel: this.channel,
      operation: "outbound.sendMessage",
      method: "POST",
      url: new URL(outboundPath, apiBaseUrl).toString(),
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        to: message.recipientId,
        text: {
          body: message.text,
        },
        metadata: message.metadata,
      }),
      timeoutMs:
        this.configService.get<number>(
          "listeners.whatsapp.timeoutMs",
          10_000,
        ) ?? 10_000,
      retryEnabled:
        this.configService.get<boolean>(
          "listeners.whatsapp.retryEnabled",
          true,
        ) ?? true,
      retryMaxAttempts:
        this.configService.get<number>(
          "listeners.whatsapp.retryMaxAttempts",
          3,
        ) ?? 3,
      retryInitialDelayMs:
        this.configService.get<number>(
          "listeners.whatsapp.retryInitialDelayMs",
          250,
        ) ?? 250,
      retryMaxDelayMs:
        this.configService.get<number>(
          "listeners.whatsapp.retryMaxDelayMs",
          2_000,
        ) ?? 2_000,
      idempotent: false,
    });
  }
}
