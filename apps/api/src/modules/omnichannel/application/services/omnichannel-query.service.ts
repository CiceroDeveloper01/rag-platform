import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  DASHBOARD_MEDIUM_TTL,
  DASHBOARD_SHORT_TTL,
} from '../../../../common/cache/constants/cache-ttl.constants';
import { CacheKeyHelper } from '../../../../common/cache/helpers/cache-key.helper';
import { AppCacheService } from '../../../../common/cache/services/app-cache.service';
import { FeatureFlagsService } from '../../../../common/feature-flags/feature-flags.service';
import { MetricTimer } from '../../../../common/observability/decorators/metric-timer.decorator';
import { Trace } from '../../../../common/observability/decorators/trace.decorator';
import { TraceContextHelper } from '../../../../common/observability/helpers/trace-context.helper';
import { OMNICHANNEL_CLOCK_SERVICE } from '../interfaces/clock-service.interface';
import type { IClockService } from '../interfaces/clock-service.interface';
import { OMNICHANNEL_CORRELATION_SERVICE } from '../interfaces/correlation-service.interface';
import type { ICorrelationService } from '../interfaces/correlation-service.interface';
import { OMNICHANNEL_METRICS_SERVICE } from '../interfaces/metrics-service.interface';
import type { IMetricsService } from '../interfaces/metrics-service.interface';
import { OMNICHANNEL_TRACE_SERVICE } from '../interfaces/trace-service.interface';
import type { ITraceService } from '../interfaces/trace-service.interface';
import { OMNICHANNEL_DASHBOARD_QUERY_REPOSITORY } from '../interfaces/omnichannel-dashboard-query-repository.interface';
import type { IOmnichannelDashboardQueryRepository } from '../interfaces/omnichannel-dashboard-query-repository.interface';
import { GetChannelMetricsQuery } from '../queries/get-channel-metrics.query';
import { GetLatencyMetricsQuery } from '../queries/get-latency-metrics.query';
import { GetOverviewQuery } from '../queries/get-overview.query';
import { GetRagUsageQuery } from '../queries/get-rag-usage.query';
import { ListConnectorsQuery } from '../queries/list-connectors.query';
import { ListExecutionsQuery } from '../queries/list-executions.query';
import { ListRequestsQuery } from '../queries/list-requests.query';

@Injectable()
export class OmnichannelQueryService {
  constructor(
    @Inject(OMNICHANNEL_DASHBOARD_QUERY_REPOSITORY)
    private readonly queryRepository: IOmnichannelDashboardQueryRepository,
    @Inject(OMNICHANNEL_METRICS_SERVICE)
    private readonly metricsService: IMetricsService,
    private readonly appCacheService: AppCacheService,
    private readonly featureFlagsService: FeatureFlagsService,
    @Inject(OMNICHANNEL_TRACE_SERVICE)
    private readonly traceService: ITraceService,
    @Inject(OMNICHANNEL_CORRELATION_SERVICE)
    private readonly correlationService: ICorrelationService,
    @Inject(OMNICHANNEL_CLOCK_SERVICE)
    private readonly clockService: IClockService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OmnichannelQueryService.name);
  }

  @Trace('dashboard.overview.get')
  async getOverview(query: GetOverviewQuery, tenantId: string) {
    this.ensureDashboardEnabled('overview');
    return this.appCacheService.wrap(
      CacheKeyHelper.build('dashboard:overview', { ...query, tenantId }),
      () =>
        this.runDashboardQuery(
          'overview',
          'omnichannel.dashboard.overview',
          { ...query, tenantId },
          () => this.queryRepository.getOverview(query, tenantId),
        ),
      { ttl: DASHBOARD_SHORT_TTL },
    );
  }

  @Trace('dashboard.requests.list')
  @MetricTimer({
    metricName: 'dashboard_requests_list_duration_ms',
    labels: { module: 'omnichannel', endpoint: 'requests' },
  })
  async listRequests(query: ListRequestsQuery, tenantId: string) {
    this.ensureDashboardEnabled('requests');
    const result = await this.appCacheService.wrap(
      CacheKeyHelper.build('dashboard:requests', { ...query, tenantId }),
      () =>
        this.runDashboardQuery(
          'requests',
          'omnichannel.dashboard.requests',
          { ...query, tenantId },
          () => this.queryRepository.listRequests(query, tenantId),
        ),
      { ttl: DASHBOARD_SHORT_TTL },
    );

    return {
      items: result.items,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    };
  }

  @Trace('dashboard.requests.get')
  async getRequestById(messageId: number, tenantId: string) {
    this.ensureDashboardEnabled('request_details');
    const result = await this.runDashboardQuery(
      'request_details',
      'omnichannel.dashboard.requests',
      { messageId, tenantId },
      () => this.queryRepository.getRequestDetails(messageId, tenantId),
    );

    if (!result) {
      throw new NotFoundException('Omnichannel request not found');
    }

    return result;
  }

  @Trace('dashboard.executions.list')
  async listExecutions(query: ListExecutionsQuery, tenantId: string) {
    this.ensureDashboardEnabled('executions');
    const result = await this.appCacheService.wrap(
      CacheKeyHelper.build('dashboard:executions', { ...query, tenantId }),
      () =>
        this.runDashboardQuery(
          'executions',
          'omnichannel.dashboard.metrics',
          { ...query, tenantId },
          () => this.queryRepository.listExecutions(query, tenantId),
        ),
      { ttl: DASHBOARD_SHORT_TTL },
    );

    return {
      items: result.items,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    };
  }

  @Trace('dashboard.executions.get')
  async getExecutionById(executionId: number, tenantId: string) {
    this.ensureDashboardEnabled('execution_details');
    const result = await this.runDashboardQuery(
      'execution_details',
      'omnichannel.dashboard.metrics',
      { executionId, tenantId },
      () => this.queryRepository.getExecutionDetails(executionId, tenantId),
    );

    if (!result) {
      throw new NotFoundException('Omnichannel execution not found');
    }

    return result;
  }

  @Trace('dashboard.connectors.list')
  async listConnectors(query: ListConnectorsQuery) {
    this.ensureDashboardEnabled('connectors');
    return this.appCacheService.wrap(
      CacheKeyHelper.build('dashboard:connectors', query),
      () =>
        this.runDashboardQuery(
          'connectors',
          'omnichannel.dashboard.metrics',
          query,
          () => this.queryRepository.listConnectors(query),
        ),
      { ttl: DASHBOARD_MEDIUM_TTL },
    );
  }

  @Trace('dashboard.metrics.channels')
  async listChannelMetrics(query: GetChannelMetricsQuery, tenantId: string) {
    this.ensureDashboardEnabled('channel_metrics');
    return this.appCacheService.wrap(
      CacheKeyHelper.build('dashboard:metrics:channels', {
        ...query,
        tenantId,
      }),
      () =>
        this.runDashboardQuery(
          'channel_metrics',
          'omnichannel.dashboard.metrics',
          { ...query, tenantId },
          () => this.queryRepository.getChannelMetrics(query, tenantId),
        ),
      { ttl: DASHBOARD_SHORT_TTL },
    );
  }

  @Trace('dashboard.metrics.latency')
  async getLatencyMetrics(query: GetLatencyMetricsQuery, tenantId: string) {
    this.ensureDashboardEnabled('latency_metrics');
    return this.appCacheService.wrap(
      CacheKeyHelper.build('dashboard:metrics:latency', { ...query, tenantId }),
      () =>
        this.runDashboardQuery(
          'latency_metrics',
          'omnichannel.dashboard.metrics',
          { ...query, tenantId },
          () => this.queryRepository.getLatencyMetrics(query, tenantId),
        ),
      { ttl: DASHBOARD_SHORT_TTL },
    );
  }

  @Trace('dashboard.metrics.rag_usage')
  async getRagUsageMetrics(query: GetRagUsageQuery, tenantId: string) {
    this.ensureDashboardEnabled('rag_usage_metrics');
    return this.appCacheService.wrap(
      CacheKeyHelper.build('dashboard:metrics:rag-usage', {
        ...query,
        tenantId,
      }),
      () =>
        this.runDashboardQuery(
          'rag_usage_metrics',
          'omnichannel.dashboard.metrics',
          { ...query, tenantId },
          () => this.queryRepository.getRagUsageMetrics(query, tenantId),
        ),
      { ttl: DASHBOARD_SHORT_TTL },
    );
  }

  private async runDashboardQuery<T>(
    endpoint: string,
    spanName: string,
    filters: object,
    operation: () => Promise<T>,
  ): Promise<T> {
    const correlationId =
      TraceContextHelper.getCorrelationId() ?? this.correlationService.create();
    const startedAt = this.clockService.now();
    const traceId = this.traceService.getCurrentTraceId() ?? correlationId;

    try {
      const result = await operation();
      const latencyMs = this.clockService.now().getTime() - startedAt.getTime();
      this.metricsService.recordDashboardQuery(endpoint, 'success');
      this.metricsService.observeDashboardLatency(endpoint, latencyMs);
      this.logger.info({
        endpoint,
        correlationId,
        traceId,
        queryTime: latencyMs,
        filters,
      });
      return result;
    } catch (error) {
      const latencyMs = this.clockService.now().getTime() - startedAt.getTime();
      this.metricsService.recordDashboardQuery(endpoint, 'error');
      this.metricsService.observeDashboardLatency(endpoint, latencyMs);
      this.logger.error(
        {
          endpoint,
          correlationId,
          traceId,
          queryTime: latencyMs,
          filters,
          error:
            error instanceof Error ? error.message : 'dashboard_query_failed',
        },
        'Omnichannel dashboard query failed',
      );
      throw error;
    }
  }

  private ensureDashboardEnabled(endpoint: string): void {
    if (this.featureFlagsService.isDashboardEnabled()) {
      return;
    }

    this.featureFlagsService.recordDisabledHit('dashboard', { endpoint });
    throw new NotFoundException('Dashboard feature is disabled');
  }
}
