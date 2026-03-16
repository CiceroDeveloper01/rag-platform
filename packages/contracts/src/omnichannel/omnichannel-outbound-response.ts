import type { ChannelType, DateTimeValue } from "@rag-platform/types";

export interface OmnichannelOutboundResponse {
  messageId: number;
  channel: ChannelType;
  conversationId: string | null;
  responseText: string;
  dispatchedAt: DateTimeValue | null;
  status: "success" | "error";
}
