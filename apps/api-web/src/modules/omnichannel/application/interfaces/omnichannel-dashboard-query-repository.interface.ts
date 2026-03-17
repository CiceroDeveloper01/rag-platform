import {
  ChannelMetricsDto,
  ConnectorDto,
  LatencyMetricsDto,
  OmnichannelExecutionDetailsDto,
  OmnichannelExecutionListItemDto,
  OmnichannelOverviewResponseDto,
  OmnichannelRequestDetailsDto,
  OmnichannelRequestListItemDto,
  RagUsageMetricsDto,
} from '../dtos/response/omnichannel-dashboard.response';
import { GetChannelMetricsQuery } from '../queries/get-channel-metrics.query';
import { GetLatencyMetricsQuery } from '../queries/get-latency-metrics.query';
import { GetOverviewQuery } from '../queries/get-overview.query';
import { GetRagUsageQuery } from '../queries/get-rag-usage.query';
import { ListConnectorsQuery } from '../queries/list-connectors.query';
import { ListExecutionsQuery } from '../queries/list-executions.query';
import { ListRequestsQuery } from '../queries/list-requests.query';

export interface PaginatedQueryResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface IOmnichannelDashboardQueryRepository {
  getOverview(
    query: GetOverviewQuery,
    tenantId: string,
  ): Promise<OmnichannelOverviewResponseDto>;
  listRequests(
    query: ListRequestsQuery,
    tenantId: string,
  ): Promise<PaginatedQueryResult<OmnichannelRequestListItemDto>>;
  getRequestDetails(
    requestId: number,
    tenantId: string,
  ): Promise<OmnichannelRequestDetailsDto | null>;
  listExecutions(
    query: ListExecutionsQuery,
    tenantId: string,
  ): Promise<PaginatedQueryResult<OmnichannelExecutionListItemDto>>;
  getExecutionDetails(
    executionId: number,
    tenantId: string,
  ): Promise<OmnichannelExecutionDetailsDto | null>;
  getChannelMetrics(
    query: GetChannelMetricsQuery,
    tenantId: string,
  ): Promise<ChannelMetricsDto[]>;
  getLatencyMetrics(
    query: GetLatencyMetricsQuery,
    tenantId: string,
  ): Promise<LatencyMetricsDto[]>;
  getRagUsageMetrics(
    query: GetRagUsageQuery,
    tenantId: string,
  ): Promise<RagUsageMetricsDto>;
  listConnectors(query: ListConnectorsQuery): Promise<ConnectorDto[]>;
}

export const OMNICHANNEL_DASHBOARD_QUERY_REPOSITORY = Symbol(
  'OMNICHANNEL_DASHBOARD_QUERY_REPOSITORY',
);
