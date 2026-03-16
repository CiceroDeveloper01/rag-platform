import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InboundMessagesQueueService } from "../queue/inbound-messages.queue";
import { InboundMessagePayload } from "../queue/inbound-message.types";
import { BaseChannelListener } from "./base-channel.listener";

@Injectable()
export class EmailListener extends BaseChannelListener {
  constructor(
    private readonly configService: ConfigService,
    inboundMessagesQueueService: InboundMessagesQueueService,
  ) {
    super(EmailListener.name, inboundMessagesQueueService);
  }

  async start(): Promise<void> {
    const enabled = this.configService.get<boolean>(
      "listeners.email.enabled",
      true,
    );
    if (!enabled) {
      this.logger.warn("Email listener disabled by configuration");
      return;
    }

    const pollIntervalMs =
      this.configService.get<number>(
        "listeners.email.pollIntervalMs",
        30_000,
      ) ?? 30_000;
    this.logger.log(
      `Email listener ready. Poll interval configured at ${String(
        pollIntervalMs,
      )}ms`,
    );
  }

  async receive(payload: InboundMessagePayload): Promise<void> {
    this.logger.log(`Publishing inbound email ${payload.externalMessageId}`);
    await this.publishInboundMessage(payload);
  }
}
