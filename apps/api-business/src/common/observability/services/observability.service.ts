import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { MetricOptions } from '../interfaces/metric-options.interface';
import { TraceOptions } from '../interfaces/trace-options.interface';
import { TraceContextHelper } from '../helpers/trace-context.helper';
import { ObservabilityMetricsService } from './metrics.service';
import { TracingService } from './tracing.service';

@Injectable()
export class ObservabilityService {
  constructor(
    private readonly tracingService: TracingService,
    private readonly metricsService: ObservabilityMetricsService,
    private readonly logger: PinoLogger,
  ) {}

  async trace<T>(
    name: string,
    operation: () => Promise<T> | T,
    options?: TraceOptions,
  ): Promise<T> {
    return this.tracingService.runInSpan(name, operation, options);
  }

  async time<T>(
    options: MetricOptions,
    operation: () => Promise<T> | T,
  ): Promise<T> {
    const startedAt = process.hrtime.bigint();

    try {
      const result = await operation();
      this.metricsService.observeDurationMs(
        options.metricName,
        Number(process.hrtime.bigint() - startedAt) / 1_000_000,
        {
          ...(options.labels ?? {}),
          status: 'success',
        },
        options,
      );
      return result;
    } catch (error) {
      this.metricsService.observeDurationMs(
        options.metricName,
        Number(process.hrtime.bigint() - startedAt) / 1_000_000,
        {
          ...(options.labels ?? {}),
          status: 'error',
        },
        options,
      );
      throw error;
    }
  }

  childLogger(context: string): PinoLogger {
    this.logger.setContext(context);
    return this.logger;
  }

  getTraceContext(): ReturnType<typeof TraceContextHelper.getContext> {
    return TraceContextHelper.getContext();
  }
}
