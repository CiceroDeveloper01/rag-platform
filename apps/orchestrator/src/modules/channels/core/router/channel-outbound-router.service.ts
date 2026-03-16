import { Injectable } from "@nestjs/common";
import { Channel } from "@rag-platform/contracts";
import {
  ChannelOutboundMessage,
  ChannelOutboundService,
} from "../interfaces/channel-outbound.interface";
import { EmailOutboundService } from "../../email/outbound/email.outbound.service";
import { TelegramOutboundService } from "../../telegram/outbound/telegram.outbound.service";
import { WhatsAppOutboundService } from "../../whatsapp/outbound/whatsapp.outbound.service";

@Injectable()
export class ChannelOutboundRouterService {
  private readonly services: ChannelOutboundService[];

  constructor(
    emailOutboundService: EmailOutboundService,
    telegramOutboundService: TelegramOutboundService,
    whatsappOutboundService: WhatsAppOutboundService,
  ) {
    this.services = [
      emailOutboundService,
      telegramOutboundService,
      whatsappOutboundService,
    ];
  }

  async send(channel: Channel, message: ChannelOutboundMessage): Promise<void> {
    const service = this.services.find((item) => item.channel === channel);
    if (!service) {
      throw new Error(`No outbound service registered for channel ${channel}`);
    }

    await service.sendMessage(message);
  }
}
