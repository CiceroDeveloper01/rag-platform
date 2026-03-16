import { Injectable } from "@nestjs/common";
import { Channel } from "@rag-platform/contracts";
import { ChannelInboundAdapter } from "../../core/interfaces/channel-inbound-adapter.interface";
import { InboundMessagePayload } from "../../../queue/inbound-message.types";
import { TelegramMessage, TelegramUpdate } from "../types/telegram.types";

@Injectable()
export class TelegramInboundAdapter implements ChannelInboundAdapter<TelegramUpdate> {
  toInboundMessage(update: TelegramUpdate): InboundMessagePayload | null {
    const message = this.resolveMessage(update);
    if (!message) {
      return null;
    }

    const document = message.document
      ? {
          providerFileId: message.document.file_id,
          fileName: message.document.file_name,
          mimeType: message.document.mime_type,
          fileSize: message.document.file_size,
        }
      : undefined;
    const body = (
      message.text ??
      message.caption ??
      document?.fileName ??
      ""
    ).trim();
    if (!body) {
      return null;
    }

    const messageType = document
      ? "document"
      : body.startsWith("/")
        ? "command"
        : "text";

    return {
      eventType: "message.received",
      channel: Channel.TELEGRAM,
      externalMessageId: `${update.update_id}:${message.message_id}`,
      conversationId: String(message.chat.id),
      from: formatTelegramSender(message),
      userId: message.from?.id ? String(message.from.id) : undefined,
      chatId: String(message.chat.id),
      messageId: String(message.message_id),
      messageType,
      text: message.text ?? message.caption ?? undefined,
      document,
      body,
      receivedAt: new Date(message.date * 1000).toISOString(),
      attachments: document
        ? [
            {
              fileName: document.fileName ?? "telegram-document",
              mimeType: document.mimeType ?? "application/octet-stream",
              providerFileId: document.providerFileId,
              fileSize: document.fileSize,
            },
          ]
        : undefined,
      metadata: {
        telegramChatId: message.chat.id,
        telegramUserId: message.from?.id,
        updateId: update.update_id,
        messageId: message.message_id,
        messageType,
      },
    };
  }

  private resolveMessage(update: TelegramUpdate): TelegramMessage | undefined {
    return update.message ?? update.edited_message;
  }
}

function formatTelegramSender(message: TelegramMessage): string {
  const username = message.from?.username;
  if (username) {
    return username;
  }

  const fullName = [message.from?.first_name, message.from?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fullName) {
    return fullName;
  }

  return String(message.from?.id ?? message.chat.id);
}
