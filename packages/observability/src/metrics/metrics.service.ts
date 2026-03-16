import { Injectable } from "@nestjs/common";

@Injectable()
export class MetricsService {
  private readonly counters = new Map<string, number>();
  private readonly measurements = new Map<string, number[]>();

  increment(metricName: string): void {
    const currentValue = this.counters.get(metricName) ?? 0;
    this.counters.set(metricName, currentValue + 1);
  }

  record(metricName: string, value: number): void {
    const currentValues = this.measurements.get(metricName) ?? [];
    currentValues.push(value);
    this.measurements.set(metricName, currentValues);
  }
}
