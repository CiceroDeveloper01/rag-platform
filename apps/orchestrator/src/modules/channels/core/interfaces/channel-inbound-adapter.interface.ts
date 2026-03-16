import { InboundMessagePayload } from "../../../queue/inbound-message.types";

export interface ChannelInboundAdapter<TInput> {
  toInboundMessage(input: TInput): InboundMessagePayload | null;
}
