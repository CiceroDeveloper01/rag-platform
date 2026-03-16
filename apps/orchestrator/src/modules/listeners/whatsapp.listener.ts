import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InboundMessagesQueueService } from "../queue/inbound-messages.queue";
import { InboundMessagePayload } from "../queue/inbound-message.types";
import { BaseChannelListener } from "./base-channel.listener";

@Injectable()
export class WhatsAppListener extends BaseChannelListener {
  constructor(
    private readonly configService: ConfigService,
    inboundMessagesQueueService: InboundMessagesQueueService,
  ) {
    super(WhatsAppListener.name, inboundMessagesQueueService);
  }

  async start(): Promise<void> {
    const enabled = this.configService.get<boolean>(
      "listeners.whatsapp.enabled",
      true,
    );
    if (!enabled) {
      this.logger.warn("WhatsApp listener disabled by configuration");
      return;
    }

    this.logger.log(
      "WhatsApp listener ready. External provider adapters should publish events here.",
    );
  }

  async receive(payload: InboundMessagePayload): Promise<void> {
    this.logger.log(
      `Publishing inbound whatsapp message ${payload.externalMessageId}`,
    );
    await this.publishInboundMessage(payload);
  }
}
