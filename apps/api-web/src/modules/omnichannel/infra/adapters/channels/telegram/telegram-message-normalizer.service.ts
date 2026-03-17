import { Injectable } from '@nestjs/common';
import { IMessageNormalizer } from '../../../../application/interfaces/message-normalizer.interface';
import { MessageChannel } from '../../../../domain/enums/message-channel.enum';
import { NormalizedMessagePayload } from '../../../../domain/value-objects/normalized-message-payload.value-object';
import { TelegramUpdatePayload } from './telegram.types';

@Injectable()
export class TelegramMessageNormalizer implements IMessageNormalizer {
  normalize(payload: NormalizedMessagePayload): NormalizedMessagePayload {
    return payload;
  }

  normalizeUpdate(payload: TelegramUpdatePayload): NormalizedMessagePayload {
    const senderName = [
      payload.message.from?.first_name,
      payload.message.from?.last_name,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return new NormalizedMessagePayload({
      channel: MessageChannel.TELEGRAM,
      externalMessageId: String(payload.message.message_id),
      conversationId: String(payload.message.chat.id),
      senderId: payload.message.from?.id
        ? String(payload.message.from.id)
        : null,
      senderName:
        senderName ||
        payload.message.from?.username ||
        payload.message.chat.title ||
        null,
      senderAddress: payload.message.from?.username ?? null,
      recipientAddress: String(payload.message.chat.id),
      body: payload.message.text,
      normalizedText: payload.message.text.trim(),
      metadata: {
        updateId: payload.update_id,
        chatId: payload.message.chat.id,
        chatType: payload.message.chat.type,
        username: payload.message.from?.username ?? null,
        messageDate: payload.message.date,
        ...payload.metadata,
      },
    });
  }
}
