import { NormalizedMessagePayload } from '../../domain/value-objects/normalized-message-payload.value-object';

export interface IMessageNormalizer {
  normalize(payload: NormalizedMessagePayload): NormalizedMessagePayload;
}

export const OMNICHANNEL_MESSAGE_NORMALIZER = Symbol(
  'OMNICHANNEL_MESSAGE_NORMALIZER',
);
