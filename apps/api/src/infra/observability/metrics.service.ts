import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';
import { HttpMetricLabels } from '../../core/contracts/observability/http-metric-labels.contract';
import { METRICS_REGISTRY } from './metrics.constants';

@Injectable()
export class MetricsService {
  private readonly customCounters = new Map<string, Counter<string>>();
  private readonly customGauges = new Map<string, Gauge<string>>();
  private readonly customHistograms = new Map<string, Histogram<string>>();
  private readonly metricsPrefix: string;
  private readonly httpRequestsTotal: Counter<
    'method' | 'route' | 'status_code'
  >;
  private readonly httpErrorsTotal: Counter<'method' | 'route' | 'status_code'>;
  private readonly httpRequestDurationSeconds: Histogram<
    'method' | 'route' | 'status_code'
  >;
  private readonly ragRequestsTotal: Counter<'route' | 'status'>;
  private readonly ragEmbeddingDurationSeconds: Histogram<'route' | 'status'>;
  private readonly ragVectorSearchDurationSeconds: Histogram<
    'route' | 'status'
  >;
  private readonly ragLlmDurationSeconds: Histogram<'route' | 'status'>;
  private readonly ragIngestionTotal: Counter<'route' | 'status'>;
  private readonly ragChunksGeneratedTotal: Counter<'route' | 'status'>;
  private readonly ragDocumentsProcessedTotal: Counter<'route' | 'status'>;
  private readonly authLoginAttemptsTotal: Counter<'status'>;
  private readonly conversationsOperationsTotal: Counter<
    'operation' | 'status'
  >;
  private readonly omnichannelRequestsTotal: Counter<'channel' | 'status'>;
  private readonly omnichannelExecutionLatencyMs: Histogram<'channel'>;
  private readonly omnichannelRagUsageTotal: Counter<'channel'>;
  private readonly omnichannelFailuresTotal: Counter<'channel'>;
  private readonly omnichannelChannelInboundTotal: Counter<'channel'>;
  private readonly omnichannelChannelOutboundTotal: Counter<
    'channel' | 'status'
  >;
  private readonly omnichannelDispatchLatencyMs: Histogram<'channel'>;
  private readonly omnichannelWebhookFailuresTotal: Counter<'channel'>;
  private readonly omnichannelDashboardQueriesTotal: Counter<
    'endpoint' | 'status'
  >;
  private readonly omnichannelDashboardLatencyMs: Histogram<'endpoint'>;

  constructor(
    @Inject(METRICS_REGISTRY) private readonly registry: Registry,
    private readonly configService: ConfigService,
  ) {
    this.metricsPrefix = this.configService.get<string>(
      'observability.metricsPrefix',
      'rag_platform_api_',
    );

    if (
      this.configService.get<boolean>(
        'observability.collectDefaultMetrics',
        true,
      )
    ) {
      collectDefaultMetrics({
        prefix: this.metricsPrefix,
        register: this.registry,
      });
    }

    this.httpRequestsTotal = new Counter({
      name: `${this.metricsPrefix}http_requests_total`,
      help: 'Total number of HTTP requests handled by the API',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpErrorsTotal = new Counter({
      name: `${this.metricsPrefix}http_errors_total`,
      help: 'Total number of HTTP requests finished with error status code',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDurationSeconds = new Histogram({
      name: `${this.metricsPrefix}http_request_duration_seconds`,
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.ragRequestsTotal = new Counter({
      name: `${this.metricsPrefix}rag_requests_total`,
      help: 'Total number of RAG pipeline executions',
      labelNames: ['route', 'status'],
      registers: [this.registry],
    });

    this.ragEmbeddingDurationSeconds = new Histogram({
      name: `${this.metricsPrefix}rag_embedding_duration_seconds`,
      help: 'Duration of embedding generation in seconds',
      labelNames: ['route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    this.ragVectorSearchDurationSeconds = new Histogram({
      name: `${this.metricsPrefix}rag_vector_search_duration_seconds`,
      help: 'Duration of vector search in seconds',
      labelNames: ['route', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
      registers: [this.registry],
    });

    this.ragLlmDurationSeconds = new Histogram({
      name: `${this.metricsPrefix}rag_llm_duration_seconds`,
      help: 'Duration of LLM completion generation in seconds',
      labelNames: ['route', 'status'],
      buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 30],
      registers: [this.registry],
    });

    this.ragIngestionTotal = new Counter({
      name: `${this.metricsPrefix}rag_ingestion_total`,
      help: 'Total number of ingestion pipeline executions',
      labelNames: ['route', 'status'],
      registers: [this.registry],
    });

    this.ragChunksGeneratedTotal = new Counter({
      name: `${this.metricsPrefix}rag_chunks_generated_total`,
      help: 'Total number of chunks generated during ingestion',
      labelNames: ['route', 'status'],
      registers: [this.registry],
    });

    this.ragDocumentsProcessedTotal = new Counter({
      name: `${this.metricsPrefix}rag_documents_processed_total`,
      help: 'Total number of document chunks persisted during ingestion',
      labelNames: ['route', 'status'],
      registers: [this.registry],
    });

    this.authLoginAttemptsTotal = new Counter({
      name: `${this.metricsPrefix}auth_logins_total`,
      help: 'Total number of authentication login attempts',
      labelNames: ['status'],
      registers: [this.registry],
    });

    this.conversationsOperationsTotal = new Counter({
      name: `${this.metricsPrefix}conversations_operations_total`,
      help: 'Total number of conversation operations by type',
      labelNames: ['operation', 'status'],
      registers: [this.registry],
    });

    this.omnichannelRequestsTotal = new Counter({
      name: `${this.metricsPrefix}omnichannel_requests_total`,
      help: 'Total number of omnichannel orchestrator requests',
      labelNames: ['channel', 'status'],
      registers: [this.registry],
    });

    this.omnichannelExecutionLatencyMs = new Histogram({
      name: `${this.metricsPrefix}omnichannel_execution_latency_ms`,
      help: 'Latency of omnichannel execution flow in milliseconds',
      labelNames: ['channel'],
      buckets: [25, 50, 100, 250, 500, 1000, 2000, 5000, 10000],
      registers: [this.registry],
    });

    this.omnichannelRagUsageTotal = new Counter({
      name: `${this.metricsPrefix}omnichannel_rag_usage_total`,
      help: 'Total number of omnichannel executions that used RAG',
      labelNames: ['channel'],
      registers: [this.registry],
    });

    this.omnichannelFailuresTotal = new Counter({
      name: `${this.metricsPrefix}omnichannel_failures_total`,
      help: 'Total number of omnichannel execution failures',
      labelNames: ['channel'],
      registers: [this.registry],
    });

    this.omnichannelChannelInboundTotal = new Counter({
      name: `${this.metricsPrefix}omnichannel_channel_inbound_total`,
      help: 'Total number of channel-specific inbound omnichannel events',
      labelNames: ['channel'],
      registers: [this.registry],
    });

    this.omnichannelChannelOutboundTotal = new Counter({
      name: `${this.metricsPrefix}omnichannel_channel_outbound_total`,
      help: 'Total number of channel-specific outbound dispatch attempts',
      labelNames: ['channel', 'status'],
      registers: [this.registry],
    });

    this.omnichannelDispatchLatencyMs = new Histogram({
      name: `${this.metricsPrefix}omnichannel_dispatch_latency_ms`,
      help: 'Latency of outbound dispatch operations in milliseconds',
      labelNames: ['channel'],
      buckets: [10, 25, 50, 100, 250, 500, 1000, 2000, 5000],
      registers: [this.registry],
    });

    this.omnichannelWebhookFailuresTotal = new Counter({
      name: `${this.metricsPrefix}omnichannel_webhook_failures_total`,
      help: 'Total number of inbound channel webhook/provider failures',
      labelNames: ['channel'],
      registers: [this.registry],
    });

    this.omnichannelDashboardQueriesTotal = new Counter({
      name: `${this.metricsPrefix}omnichannel_dashboard_queries_total`,
      help: 'Total number of omnichannel dashboard query executions',
      labelNames: ['endpoint', 'status'],
      registers: [this.registry],
    });

    this.omnichannelDashboardLatencyMs = new Histogram({
      name: `${this.metricsPrefix}omnichannel_dashboard_latency_ms`,
      help: 'Latency of omnichannel dashboard queries in milliseconds',
      labelNames: ['endpoint'],
      buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2000],
      registers: [this.registry],
    });
  }

  recordRequest(labels: HttpMetricLabels, durationInSeconds: number): void {
    this.httpRequestsTotal.inc(labels);
    this.httpRequestDurationSeconds.observe(labels, durationInSeconds);

    if (Number(labels.status_code) >= 400) {
      this.httpErrorsTotal.inc(labels);
    }
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  recordRagRequest(route: string, status: 'success' | 'error'): void {
    this.ragRequestsTotal.inc({
      route,
      status,
    });
  }

  observeRagEmbeddingDuration(
    route: string,
    status: 'success' | 'error',
    durationInSeconds: number,
  ): void {
    this.ragEmbeddingDurationSeconds.observe(
      { route, status },
      durationInSeconds,
    );
  }

  observeRagVectorSearchDuration(
    route: string,
    status: 'success' | 'error',
    durationInSeconds: number,
  ): void {
    this.ragVectorSearchDurationSeconds.observe(
      { route, status },
      durationInSeconds,
    );
  }

  observeRagLlmDuration(
    route: string,
    status: 'success' | 'error',
    durationInSeconds: number,
  ): void {
    this.ragLlmDurationSeconds.observe({ route, status }, durationInSeconds);
  }

  recordIngestion(route: string, status: 'success' | 'error'): void {
    this.ragIngestionTotal.inc({ route, status });
  }

  incrementChunksGenerated(
    route: string,
    status: 'success' | 'error',
    count: number,
  ): void {
    this.ragChunksGeneratedTotal.inc({ route, status }, count);
  }

  incrementDocumentsProcessed(
    route: string,
    status: 'success' | 'error',
    count: number,
  ): void {
    this.ragDocumentsProcessedTotal.inc({ route, status }, count);
  }

  recordAuthLogin(status: 'success' | 'error'): void {
    this.authLoginAttemptsTotal.inc({ status });
  }

  recordConversationOperation(
    operation: 'create' | 'append' | 'delete' | 'list' | 'get',
    status: 'success' | 'error',
  ): void {
    this.conversationsOperationsTotal.inc({ operation, status });
  }

  recordOmnichannelRequest(channel: string, status: 'success' | 'error'): void {
    this.omnichannelRequestsTotal.inc({ channel, status });
  }

  observeOmnichannelExecutionLatency(channel: string, latencyMs: number): void {
    this.omnichannelExecutionLatencyMs.observe({ channel }, latencyMs);
  }

  recordOmnichannelRagUsage(channel: string): void {
    this.omnichannelRagUsageTotal.inc({ channel });
  }

  recordOmnichannelFailure(channel: string): void {
    this.omnichannelFailuresTotal.inc({ channel });
  }

  recordOmnichannelChannelInbound(channel: string): void {
    this.omnichannelChannelInboundTotal.inc({ channel });
  }

  recordOmnichannelChannelOutbound(
    channel: string,
    status: 'success' | 'error',
  ): void {
    this.omnichannelChannelOutboundTotal.inc({ channel, status });
  }

  observeOmnichannelDispatchLatency(channel: string, latencyMs: number): void {
    this.omnichannelDispatchLatencyMs.observe({ channel }, latencyMs);
  }

  recordOmnichannelWebhookFailure(channel: string): void {
    this.omnichannelWebhookFailuresTotal.inc({ channel });
  }

  recordOmnichannelDashboardQuery(
    endpoint: string,
    status: 'success' | 'error',
  ): void {
    this.omnichannelDashboardQueriesTotal.inc({ endpoint, status });
  }

  observeOmnichannelDashboardLatency(
    endpoint: string,
    latencyMs: number,
  ): void {
    this.omnichannelDashboardLatencyMs.observe({ endpoint }, latencyMs);
  }

  incrementCustomCounter(
    metricName: string,
    labels: Record<string, string> = {},
    value = 1,
    description = `Custom counter for ${metricName}`,
  ): void {
    this.getOrCreateCounter(metricName, labels, description).inc(labels, value);
  }

  observeCustomHistogram(
    metricName: string,
    value: number,
    labels: Record<string, string> = {},
    options?: {
      description?: string;
      buckets?: number[];
    },
  ): void {
    this.getOrCreateHistogram(metricName, labels, options).observe(
      labels,
      value,
    );
  }

  setCustomGauge(
    metricName: string,
    value: number,
    labels: Record<string, string> = {},
    description = `Custom gauge for ${metricName}`,
  ): void {
    this.getOrCreateGauge(metricName, labels, description).set(labels, value);
  }

  private getOrCreateCounter(
    metricName: string,
    labels: Record<string, string>,
    description: string,
  ): Counter<string> {
    const normalizedMetricName = this.normalizeMetricName(metricName);
    const existingCounter = this.customCounters.get(normalizedMetricName);

    if (existingCounter) {
      return existingCounter;
    }

    const counter = new Counter({
      name: normalizedMetricName,
      help: description,
      labelNames: Object.keys(labels),
      registers: [this.registry],
    });

    this.customCounters.set(normalizedMetricName, counter);
    return counter;
  }

  private getOrCreateHistogram(
    metricName: string,
    labels: Record<string, string>,
    options?: {
      description?: string;
      buckets?: number[];
    },
  ): Histogram<string> {
    const normalizedMetricName = this.normalizeMetricName(metricName);
    const existingHistogram = this.customHistograms.get(normalizedMetricName);

    if (existingHistogram) {
      return existingHistogram;
    }

    const histogram = new Histogram({
      name: normalizedMetricName,
      help: options?.description ?? `Custom histogram for ${metricName}`,
      labelNames: Object.keys(labels),
      buckets: options?.buckets ?? [
        5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000,
      ],
      registers: [this.registry],
    });

    this.customHistograms.set(normalizedMetricName, histogram);
    return histogram;
  }

  private getOrCreateGauge(
    metricName: string,
    labels: Record<string, string>,
    description: string,
  ): Gauge<string> {
    const normalizedMetricName = this.normalizeMetricName(metricName);
    const existingGauge = this.customGauges.get(normalizedMetricName);

    if (existingGauge) {
      return existingGauge;
    }

    const gauge = new Gauge({
      name: normalizedMetricName,
      help: description,
      labelNames: Object.keys(labels),
      registers: [this.registry],
    });

    this.customGauges.set(normalizedMetricName, gauge);
    return gauge;
  }

  private normalizeMetricName(metricName: string): string {
    if (metricName.startsWith(this.metricsPrefix)) {
      return metricName;
    }

    return `${this.metricsPrefix}${metricName}`;
  }
}
