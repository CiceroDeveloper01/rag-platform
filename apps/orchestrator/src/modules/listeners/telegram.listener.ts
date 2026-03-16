import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InboundMessagesQueueService } from "../queue/inbound-messages.queue";
import { InboundMessagePayload } from "../queue/inbound-message.types";
import { BaseChannelListener } from "./base-channel.listener";

@Injectable()
export class TelegramListener extends BaseChannelListener {
  constructor(
    private readonly configService: ConfigService,
    inboundMessagesQueueService: InboundMessagesQueueService,
  ) {
    super(TelegramListener.name, inboundMessagesQueueService);
  }

  async start(): Promise<void> {
    const enabled = this.configService.get<boolean>(
      "listeners.telegram.enabled",
      true,
    );
    if (!enabled) {
      this.logger.warn("Telegram listener disabled by configuration");
      return;
    }

    this.logger.log(
      "Telegram listener ready. External webhook integration should publish events here.",
    );
  }

  async receive(payload: InboundMessagePayload): Promise<void> {
    this.logger.log(
      `Publishing inbound telegram message ${payload.externalMessageId}`,
    );
    await this.publishInboundMessage(payload);
  }
}
