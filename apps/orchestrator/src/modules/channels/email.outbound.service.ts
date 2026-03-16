import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Channel } from "@rag-platform/contracts";
import {
  ChannelOutboundMessage,
  ChannelOutboundService,
} from "./channel-outbound.interface";
import { ChannelHttpClient } from "./channel-http.client";
import { EmailOutboundPayload } from "./email.types";

@Injectable()
export class EmailOutboundService implements ChannelOutboundService {
  readonly channel = Channel.EMAIL;

  constructor(
    private readonly configService: ConfigService,
    private readonly channelHttpClient: ChannelHttpClient,
  ) {}

  async sendMessage(message: ChannelOutboundMessage): Promise<void> {
    const apiBaseUrl = this.configService.get<string>(
      "listeners.email.apiBaseUrl",
    );
    const outboundPath =
      this.configService.get<string>("listeners.email.outboundPath") ??
      "/messages/send";

    if (!apiBaseUrl) {
      throw new Error("Email outbound API is not configured");
    }

    const token = this.configService.get<string>("listeners.email.apiToken");
    const payload: EmailOutboundPayload = {
      to: message.recipientId,
      subject: message.subject ?? "AI Response",
      text: message.text,
      metadata: message.metadata,
    };

    await this.channelHttpClient.requestJson({
      channel: this.channel,
      operation: "outbound.sendMessage",
      method: "POST",
      url: new URL(outboundPath, apiBaseUrl).toString(),
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      timeoutMs:
        this.configService.get<number>("listeners.email.timeoutMs", 10_000) ??
        10_000,
      retryEnabled:
        this.configService.get<boolean>("listeners.email.retryEnabled", true) ??
        true,
      retryMaxAttempts:
        this.configService.get<number>("listeners.email.retryMaxAttempts", 3) ??
        3,
      retryInitialDelayMs:
        this.configService.get<number>(
          "listeners.email.retryInitialDelayMs",
          250,
        ) ?? 250,
      retryMaxDelayMs:
        this.configService.get<number>(
          "listeners.email.retryMaxDelayMs",
          2_000,
        ) ?? 2_000,
      idempotent: false,
    });
  }
}
