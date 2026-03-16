import { Injectable } from '@nestjs/common';
import { IChannelAdapter } from '../../../../application/interfaces/channel-adapter.interface';
import { MessageChannel } from '../../../../domain/enums/message-channel.enum';
import { NormalizedMessagePayload } from '../../../../domain/value-objects/normalized-message-payload.value-object';
import { EmailMessageNormalizer } from './email-message-normalizer.service';
import type { EmailInboundPayload } from './email.types';

@Injectable()
export class EmailChannelAdapter implements IChannelAdapter {
  constructor(private readonly normalizer: EmailMessageNormalizer) {}

  supports(channel: MessageChannel): boolean {
    return channel === MessageChannel.EMAIL;
  }

  normalize(input: unknown): NormalizedMessagePayload {
    return this.normalizer.normalizeInbound(input as EmailInboundPayload);
  }
}
