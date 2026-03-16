import { Injectable } from '@nestjs/common';
import {
  IOutboundDispatcher,
  OutboundDispatchRequest,
  OutboundDispatchResult,
} from '../../application/interfaces/outbound-dispatcher.interface';
import { MessageChannel } from '../../domain/enums/message-channel.enum';

@Injectable()
export class FutureChannelStubDispatcher implements IOutboundDispatcher {
  private readonly supportedChannels = new Set<MessageChannel>([
    MessageChannel.TEAMS,
    MessageChannel.WHATSAPP,
    MessageChannel.SLACK,
    MessageChannel.SMS,
    MessageChannel.VOICE,
    MessageChannel.ROAM,
  ]);

  supports(channel: MessageChannel): boolean {
    return this.supportedChannels.has(channel);
  }

  async dispatch(
    request: OutboundDispatchRequest,
  ): Promise<OutboundDispatchResult> {
    return {
      accepted: false,
      externalDispatchId: null,
      metadata: {
        channel: request.channel,
        reason: 'future_channel_dispatcher_not_implemented_yet',
      },
    };
  }
}
