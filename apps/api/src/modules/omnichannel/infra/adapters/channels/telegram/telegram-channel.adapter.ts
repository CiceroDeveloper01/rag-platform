import { Injectable } from '@nestjs/common';
import { IChannelAdapter } from '../../../../application/interfaces/channel-adapter.interface';
import { MessageChannel } from '../../../../domain/enums/message-channel.enum';
import { NormalizedMessagePayload } from '../../../../domain/value-objects/normalized-message-payload.value-object';
import { TelegramMessageNormalizer } from './telegram-message-normalizer.service';
import { TelegramUpdatePayload } from './telegram.types';

@Injectable()
export class TelegramChannelAdapter implements IChannelAdapter {
  constructor(private readonly normalizer: TelegramMessageNormalizer) {}

  supports(channel: MessageChannel): boolean {
    return channel === MessageChannel.TELEGRAM;
  }

  normalize(input: unknown): NormalizedMessagePayload {
    return this.normalizer.normalizeUpdate(input as TelegramUpdatePayload);
  }
}
