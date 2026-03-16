import { Injectable } from '@nestjs/common';
import { IMessageNormalizer } from '../../application/interfaces/message-normalizer.interface';
import { NormalizedMessagePayload } from '../../domain/value-objects/normalized-message-payload.value-object';

@Injectable()
export class DefaultMessageNormalizerService implements IMessageNormalizer {
  normalize(payload: NormalizedMessagePayload): NormalizedMessagePayload {
    const source = payload.toObject();

    return new NormalizedMessagePayload({
      ...source,
      body: source.body.trim(),
      normalizedText: source.normalizedText.trim().replace(/\s+/g, ' '),
    });
  }
}
