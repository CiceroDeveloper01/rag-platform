import type {
  ChannelType,
  DateTimeValue,
  OmnichannelExecutionStatus,
} from "@rag-platform/types";

export interface OmnichannelExecutionListItemResponse {
  executionId: number;
  messageId: number;
  channel: ChannelType;
  agentName: string;
  usedRag: boolean;
  modelName: string | null;
  latencyMs: number | null;
  status: OmnichannelExecutionStatus;
  startedAt: DateTimeValue;
  finishedAt: DateTimeValue | null;
}
