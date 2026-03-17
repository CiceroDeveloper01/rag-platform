import { Injectable } from '@nestjs/common';
import { MetricsService } from '../../../infra/observability/metrics.service';
import { MetricOptions } from '../interfaces/metric-options.interface';

@Injectable()
export class ObservabilityMetricsService {
  constructor(private readonly metricsService: MetricsService) {}

  observeDurationMs(
    metricName: string,
    durationMs: number,
    labels: Record<string, string> = {},
    options?: Omit<MetricOptions, 'metricName' | 'labels'>,
  ): void {
    this.metricsService.observeCustomHistogram(metricName, durationMs, labels, {
      description:
        options?.description ?? `Duration for ${metricName} in milliseconds`,
      buckets: options?.buckets,
    });
  }

  incrementCounter(
    metricName: string,
    labels: Record<string, string> = {},
    value = 1,
    description?: string,
  ): void {
    this.metricsService.incrementCustomCounter(
      metricName,
      labels,
      value,
      description,
    );
  }

  setGauge(
    metricName: string,
    value: number,
    labels: Record<string, string> = {},
    description?: string,
  ): void {
    this.metricsService.setCustomGauge(metricName, value, labels, description);
  }
}
