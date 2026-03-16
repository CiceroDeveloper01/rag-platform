import { MetricsRecorder } from "./metrics-recorder";

export class NoopMetricsRecorder implements MetricsRecorder {
  increment(_metricName: string, _labels?: Record<string, string>): void {}

  observe(
    _metricName: string,
    _value: number,
    _labels?: Record<string, string>,
  ): void {}
}
