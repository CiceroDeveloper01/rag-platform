import type { ChannelType } from "@rag-platform/types";

export interface ChannelMetricsResponse {
  channel: ChannelType;
  totalRequests: number;
  successCount: number;
  errorCount: number;
}

export interface LatencyMetricsResponse {
  channel: ChannelType;
  avgLatencyMs: number;
  p95LatencyMs: number;
}

export interface RagUsageByChannelResponse {
  channel: ChannelType;
  totalExecutions: number;
  ragExecutions: number;
  ragUsagePercentage: number;
}

export interface RagUsageMetricsResponse {
  totalExecutions: number;
  ragExecutions: number;
  ragUsagePercentage: number;
  channels: RagUsageByChannelResponse[];
}
