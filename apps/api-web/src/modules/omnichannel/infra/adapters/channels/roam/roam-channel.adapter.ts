import { Injectable, NotImplementedException } from '@nestjs/common';
import { IChannelAdapter } from '../../../../application/interfaces/channel-adapter.interface';
import { MessageChannel } from '../../../../domain/enums/message-channel.enum';
import { NormalizedMessagePayload } from '../../../../domain/value-objects/normalized-message-payload.value-object';

@Injectable()
export class RoamChannelAdapterStub implements IChannelAdapter {
  supports(channel: MessageChannel): boolean {
    return channel === MessageChannel.ROAM;
  }

  normalize(input: unknown): NormalizedMessagePayload {
    void input;
    throw new NotImplementedException(
      'Roam adapter will be implemented in a future iteration',
    );
  }
}
