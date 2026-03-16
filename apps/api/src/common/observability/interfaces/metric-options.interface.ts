export interface MetricOptions {
  metricName: string;
  labels?: Record<string, string>;
  description?: string;
  buckets?: number[];
}
