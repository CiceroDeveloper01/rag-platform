import type {
  ChannelType,
  DateTimeValue,
  ExecutionEventName,
  MessageDirection,
  OmnichannelExecutionStatus,
  OmnichannelMessageStatus,
} from "@rag-platform/types";

export interface OmnichannelRequestListItemResponse {
  id: number;
  channel: ChannelType;
  conversationId: string | null;
  senderName: string | null;
  senderAddress: string | null;
  normalizedTextPreview: string;
  status: OmnichannelMessageStatus;
  receivedAt: DateTimeValue;
  processedAt: DateTimeValue | null;
  latencyMs: number | null;
  usedRag: boolean;
}

export interface OmnichannelExecutionDetailsResponse {
  executionId: number | null;
  agentName: string | null;
  usedRag: boolean;
  ragQuery: string | null;
  modelName: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number | null;
  status: OmnichannelExecutionStatus | null;
  errorMessage: string | null;
  startedAt: DateTimeValue | null;
  finishedAt: DateTimeValue | null;
  timeline: ExecutionTimelineEventResponse[];
}

export interface ExecutionTimelineEventResponse {
  id: number;
  eventName: ExecutionEventName;
  occurredAt: DateTimeValue;
  metadata: Record<string, unknown> | null;
}

export interface OmnichannelRequestDetailsResponse {
  message: {
    id: number;
    channel: ChannelType;
    direction: MessageDirection;
    conversationId: string | null;
    senderName: string | null;
    senderAddress: string | null;
    recipientAddress: string | null;
    subject: string | null;
    body: string;
    normalizedText: string;
    metadata: Record<string, unknown> | null;
    status: OmnichannelMessageStatus;
    receivedAt: DateTimeValue;
    processedAt: DateTimeValue | null;
  };
  execution: OmnichannelExecutionDetailsResponse | null;
}
