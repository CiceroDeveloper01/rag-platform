import type { ChannelType } from "@rag-platform/types";

export interface OmnichannelOverviewChannelResponse {
  channel: ChannelType;
  totalRequests: number;
  success: number;
  errors: number;
}

export interface OmnichannelOverviewResponse {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  ragUsagePercentage: number;
  activeConnectors: number;
  requestsLast24h: number;
  requestsLast7d: number;
  channels: OmnichannelOverviewChannelResponse[];
}
