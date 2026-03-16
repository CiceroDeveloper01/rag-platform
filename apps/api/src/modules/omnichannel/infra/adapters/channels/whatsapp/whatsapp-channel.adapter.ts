import { Injectable, NotImplementedException } from '@nestjs/common';
import { IChannelAdapter } from '../../../../application/interfaces/channel-adapter.interface';
import { MessageChannel } from '../../../../domain/enums/message-channel.enum';
import { NormalizedMessagePayload } from '../../../../domain/value-objects/normalized-message-payload.value-object';

@Injectable()
export class WhatsappChannelAdapterStub implements IChannelAdapter {
  supports(channel: MessageChannel): boolean {
    return channel === MessageChannel.WHATSAPP;
  }

  normalize(input: unknown): NormalizedMessagePayload {
    void input;
    throw new NotImplementedException(
      'WhatsApp adapter will be implemented in a future iteration',
    );
  }
}
