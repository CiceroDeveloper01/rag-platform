export interface MetricsRecorder {
  increment(metricName: string, labels?: Record<string, string>): void;
  observe(
    metricName: string,
    value: number,
    labels?: Record<string, string>,
  ): void;
}
