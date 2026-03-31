import { Injectable } from "@nestjs/common";

@Injectable()
export class MetricsService {
  private readonly counters = new Map<string, number>();
  private readonly measurements = new Map<string, number[]>();

  increment(metricName: string, labels?: Record<string, string>): void {
    const key = buildMetricKey(metricName, labels);
    const currentValue = this.counters.get(key) ?? 0;
    this.counters.set(key, currentValue + 1);
  }

  record(metricName: string, value: number): void {
    const currentValues = this.measurements.get(metricName) ?? [];
    currentValues.push(value);
    this.measurements.set(metricName, currentValues);
  }
}

function buildMetricKey(
  metricName: string,
  labels?: Record<string, string>,
): string {
  if (!labels || Object.keys(labels).length === 0) {
    return metricName;
  }

  const serializedLabels = Object.entries(labels)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join(",");

  return `${metricName}{${serializedLabels}}`;
}
