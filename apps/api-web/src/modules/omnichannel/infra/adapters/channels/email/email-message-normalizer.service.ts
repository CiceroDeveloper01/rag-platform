import { Injectable } from '@nestjs/common';
import { IMessageNormalizer } from '../../../../application/interfaces/message-normalizer.interface';
import { MessageChannel } from '../../../../domain/enums/message-channel.enum';
import { NormalizedMessagePayload } from '../../../../domain/value-objects/normalized-message-payload.value-object';
import { EmailParserService } from '../../../parsers/email-parser.service';
import type { EmailInboundPayload } from './email.types';

@Injectable()
export class EmailMessageNormalizer implements IMessageNormalizer {
  constructor(private readonly emailParserService: EmailParserService) {}

  normalize(payload: NormalizedMessagePayload): NormalizedMessagePayload {
    return payload;
  }

  normalizeInbound(payload: EmailInboundPayload): NormalizedMessagePayload {
    const parsed = this.emailParserService.parse(payload);

    return new NormalizedMessagePayload({
      channel: MessageChannel.EMAIL,
      externalMessageId: parsed.externalMessageId,
      conversationId: parsed.conversationId,
      senderName: parsed.senderName,
      senderAddress: parsed.senderAddress,
      recipientAddress: parsed.recipientAddress,
      subject: parsed.subject,
      body: parsed.body,
      normalizedText: parsed.body,
      metadata: parsed.metadata,
    });
  }
}
