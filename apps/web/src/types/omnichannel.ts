import type {
  ChannelMetricsResponse,
  ConnectorListItemResponse,
  ExecutionStreamEventResponse,
  LatencyMetricsResponse,
  OmnichannelExecutionListItemResponse,
  OmnichannelOverviewChannelResponse,
  OmnichannelOverviewResponse,
  OmnichannelRequestDetailsResponse,
  OmnichannelRequestListItemResponse,
  PaginatedResponse,
  RagUsageByChannelResponse,
  RagUsageMetricsResponse,
} from "@rag-platform/contracts";
import type {
  ChannelType,
  ConnectorHealthStatus,
  DateRangeFilter,
  OmnichannelMessageStatus,
  PaginationMeta,
  SortOrder,
} from "@rag-platform/types";

export type OmnichannelChannel = ChannelType;
export type OmnichannelOverviewChannel = OmnichannelOverviewChannelResponse;
export type OmnichannelOverview = OmnichannelOverviewResponse;
export type OmnichannelPagination = PaginationMeta;
export type OmnichannelRequest = OmnichannelRequestListItemResponse;
export type OmnichannelRequestsResponse =
  PaginatedResponse<OmnichannelRequestListItemResponse>;
export type OmnichannelExecution = OmnichannelExecutionListItemResponse;
export type OmnichannelExecutionsResponse =
  PaginatedResponse<OmnichannelExecutionListItemResponse>;
export type OmnichannelRequestDetails = OmnichannelRequestDetailsResponse;
export type ChannelMetrics = ChannelMetricsResponse;
export type LatencyMetrics = LatencyMetricsResponse;
export type RagUsageByChannel = RagUsageByChannelResponse;
export type RagUsageMetrics = RagUsageMetricsResponse;
export type Connector = ConnectorListItemResponse;
export type ExecutionStreamEvent = ExecutionStreamEventResponse;

export interface OmnichannelRequestFilters {
  channel?: OmnichannelChannel | "";
  status?: OmnichannelMessageStatus | "";
  startDate?: string;
  endDate?: string;
  conversationId?: string;
  senderId?: string;
  usedRag?: "true" | "false" | "";
  offset?: number;
  limit?: number;
  sortOrder?: SortOrder;
}

export interface OmnichannelConnectorFilters {
  channel?: OmnichannelChannel | "";
  isEnabled?: "true" | "false" | "";
  healthStatus?: ConnectorHealthStatus | "";
}

export type OmnichannelMetricPeriodFilters = DateRangeFilter;
