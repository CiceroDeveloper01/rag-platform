import type { ChannelType } from "@rag-platform/types";

export interface OmnichannelInboundRequest {
  channel: ChannelType;
  externalMessageId?: string | null;
  conversationId?: string | null;
  senderId?: string | null;
  senderName?: string | null;
  senderAddress?: string | null;
  recipientAddress?: string | null;
  subject?: string | null;
  body: string;
  normalizedText?: string | null;
  metadata?: Record<string, unknown> | null;
}
