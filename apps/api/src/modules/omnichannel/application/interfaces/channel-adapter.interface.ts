import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { NormalizedMessagePayload } from '../../domain/value-objects/normalized-message-payload.value-object';

export interface IChannelAdapter {
  supports(channel: MessageChannel): boolean;
  normalize(input: unknown): NormalizedMessagePayload;
}

export const OMNICHANNEL_CHANNEL_ADAPTER = Symbol(
  'OMNICHANNEL_CHANNEL_ADAPTER',
);
