import { Channel } from "@rag-platform/contracts";

export interface ChannelListener {
  readonly channel: Channel;
  start(): Promise<void>;
}
