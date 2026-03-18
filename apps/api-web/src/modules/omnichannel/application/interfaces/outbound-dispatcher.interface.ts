import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { OmnichannelMessage } from '../../domain/entities/omnichannel-message.entity';

export interface OutboundDispatchRequest {
  message: OmnichannelMessage;
  channel: MessageChannel;
  correlationId: string;
}

export interface OutboundDispatchResult {
  accepted: boolean;
  externalDispatchId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface IOutboundDispatcher {
  supports(channel: MessageChannel): boolean;
  dispatch(request: OutboundDispatchRequest): Promise<OutboundDispatchResult>;
}

export const OMNICHANNEL_OUTBOUND_DISPATCHER = Symbol(
  'OMNICHANNEL_OUTBOUND_DISPATCHER',
);
