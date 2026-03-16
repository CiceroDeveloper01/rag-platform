import { Channel } from "@rag-platform/contracts";

export interface ChannelOutboundMessage {
  recipientId: string;
  text: string;
  subject?: string;
  metadata?: Record<string, unknown>;
}

export interface ChannelOutboundService {
  readonly channel: Channel;
  sendMessage(message: ChannelOutboundMessage): Promise<void>;
}
