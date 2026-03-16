import type { ChannelMessageEvent } from "@rag-platform/contracts";

export type SupportedChannel = ChannelMessageEvent["channel"];
export type InboundMessagePayload = ChannelMessageEvent;
