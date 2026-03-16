import { Injectable } from "@nestjs/common";
import { Channel } from "@rag-platform/contracts";
import { ChannelInboundAdapter } from "../../core/interfaces/channel-inbound-adapter.interface";
import { InboundMessagePayload } from "../../../queue/inbound-message.types";
import {
  WhatsAppContact,
  WhatsAppInboundPayload,
  WhatsAppMessage,
} from "../types/whatsapp.types";

@Injectable()
export class WhatsAppInboundAdapter implements ChannelInboundAdapter<WhatsAppInboundPayload> {
  toInboundMessage(
    input: WhatsAppInboundPayload,
  ): InboundMessagePayload | null {
    const value = input.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    if (!value || !message) {
      return null;
    }

    const body = message.text?.body?.trim();
    if (!body) {
      return null;
    }

    const contact = value.contacts?.find((item) => item.wa_id === message.from);

    return {
      eventType: "message.received",
      channel: Channel.WHATSAPP,
      externalMessageId: message.id,
      conversationId: message.from,
      from: formatWhatsAppSender(contact, message),
      userId: message.from,
      chatId: message.from,
      messageId: message.id,
      messageType: "text",
      text: body,
      body,
      receivedAt: new Date(Number(message.timestamp) * 1000).toISOString(),
      metadata: {
        whatsappUserId: message.from,
        whatsappPhoneNumberId: value.metadata?.phone_number_id,
        displayPhoneNumber: value.metadata?.display_phone_number,
      },
    };
  }
}

function formatWhatsAppSender(
  contact: WhatsAppContact | undefined,
  message: WhatsAppMessage,
) {
  return contact?.profile?.name?.trim() || contact?.wa_id || message.from;
}
