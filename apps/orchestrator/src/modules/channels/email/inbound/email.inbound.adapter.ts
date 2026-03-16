import { Injectable } from "@nestjs/common";
import { Channel } from "@rag-platform/contracts";
import { ChannelInboundAdapter } from "../../core/interfaces/channel-inbound-adapter.interface";
import { InboundMessagePayload } from "../../../queue/inbound-message.types";
import { EmailInboundPayload } from "../types/email.types";

@Injectable()
export class EmailInboundAdapter implements ChannelInboundAdapter<EmailInboundPayload> {
  toInboundMessage(input: EmailInboundPayload): InboundMessagePayload | null {
    const body = input.body.trim();
    if (!body) {
      return null;
    }

    return {
      eventType: "message.received",
      channel: Channel.EMAIL,
      externalMessageId: input.externalMessageId,
      conversationId:
        input.conversationId ?? input.metadata?.threadId?.toString(),
      from: input.fromName?.trim() || input.fromEmail,
      userId: input.fromEmail,
      chatId: input.conversationId ?? input.metadata?.threadId?.toString(),
      messageId: input.externalMessageId,
      messageType: (input.attachments?.length ?? 0) > 0 ? "document" : "text",
      text: body,
      subject: input.subject?.trim() || undefined,
      body,
      attachments: input.attachments ?? [],
      receivedAt: input.receivedAt ?? new Date().toISOString(),
      metadata: {
        ...input.metadata,
        fromEmail: input.fromEmail,
        toEmail: input.toEmail,
      },
    };
  }
}
