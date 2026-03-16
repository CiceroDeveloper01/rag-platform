import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Channel } from "@rag-platform/contracts";
import { AppLoggerService } from "@rag-platform/observability";
import { BaseChannelListener } from "../../core/interfaces/base-channel.listener";
import { InboundMessagesQueueService } from "../../../queue/inbound-messages.queue";
import { InboundMessagePayload } from "../../../queue/inbound-message.types";
import { WhatsAppInboundAdapter } from "../inbound/whatsapp.inbound.adapter";
import { WhatsAppInboundPayload } from "../types/whatsapp.types";

@Injectable()
export class WhatsAppListener extends BaseChannelListener {
  readonly channel = Channel.WHATSAPP;

  constructor(
    private readonly configService: ConfigService,
    private readonly whatsappInboundAdapter: WhatsAppInboundAdapter,
    logger: AppLoggerService,
    inboundMessagesQueueService: InboundMessagesQueueService,
  ) {
    super(logger, inboundMessagesQueueService, WhatsAppListener.name);
  }

  async start(): Promise<void> {
    const enabled = this.configService.get<boolean>(
      "listeners.whatsapp.enabled",
      true,
    );
    if (!enabled) {
      this.logDisabled();
      return;
    }

    const mode =
      this.configService.get<string>("listeners.whatsapp.mode", "manual") ??
      "manual";
    this.logReady({ mode });
  }

  async receive(event: InboundMessagePayload): Promise<void> {
    await this.publishInboundMessage(event);
  }

  async receiveRaw(event: WhatsAppInboundPayload): Promise<void> {
    const payload = this.whatsappInboundAdapter.toInboundMessage(event);
    if (!payload) {
      this.logger.warn(
        "Ignoring unsupported whatsapp payload",
        WhatsAppListener.name,
        {
          channel: this.channel,
        },
      );
      return;
    }

    await this.publishInboundMessage(payload);
  }
}
