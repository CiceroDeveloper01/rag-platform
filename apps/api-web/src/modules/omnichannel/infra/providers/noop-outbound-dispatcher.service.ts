import { Injectable } from '@nestjs/common';
import {
  IOutboundDispatcher,
  OutboundDispatchRequest,
  OutboundDispatchResult,
} from '../../application/interfaces/outbound-dispatcher.interface';
import { MessageChannel } from '../../domain/enums/message-channel.enum';

@Injectable()
export class NoopOutboundDispatcher implements IOutboundDispatcher {
  supports(channel: MessageChannel): boolean {
    void channel;
    return true;
  }

  async dispatch(
    request: OutboundDispatchRequest,
  ): Promise<OutboundDispatchResult> {
    void request;
    return {
      accepted: false,
      externalDispatchId: null,
      metadata: {
        reason: 'channel_dispatcher_not_implemented_yet',
      },
    };
  }
}
