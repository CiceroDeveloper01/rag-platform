import { Channel } from "@rag-platform/contracts";

export interface FlowExecutionPayload {
  externalMessageId: string;
  channel: Channel;
  context?: Record<string, unknown>;
}
