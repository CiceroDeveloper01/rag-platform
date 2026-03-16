import { Injectable } from '@nestjs/common';
import { SpanStatusCode } from '@opentelemetry/api';
import { TracingService } from '../../../../common/observability/services/tracing.service';
import { TraceContextHelper } from '../../../../common/observability/helpers/trace-context.helper';
import {
  ITraceService,
  TraceSpan,
} from '../../application/interfaces/trace-service.interface';

class BasicTraceSpan implements TraceSpan {
  constructor(
    public readonly traceId: string,
    public readonly spanId: string,
    private readonly onEnd: (
      status?: 'success' | 'error',
      attributes?: Record<string, unknown>,
    ) => void,
  ) {}

  end(
    status?: 'success' | 'error',
    attributes?: Record<string, unknown>,
  ): void {
    this.onEnd(status, attributes);
  }
}

@Injectable()
export class OpenTelemetryTraceService implements ITraceService {
  constructor(private readonly tracingService: TracingService) {}

  startSpan(name: string, attributes?: Record<string, unknown>): TraceSpan {
    const span = this.tracingService.createSpan(name, attributes);
    const spanContext = span.spanContext();

    return new BasicTraceSpan(
      spanContext.traceId,
      spanContext.spanId,
      (status, endAttributes) => {
        if (endAttributes) {
          Object.entries(endAttributes).forEach(([key, value]) => {
            if (
              typeof value === 'string' ||
              typeof value === 'number' ||
              typeof value === 'boolean'
            ) {
              span.setAttribute(key, value);
            }
          });
        }

        span.setStatus({
          code: status === 'error' ? SpanStatusCode.ERROR : SpanStatusCode.OK,
        });
        span.end();
      },
    );
  }

  getCurrentTraceId(): string | undefined {
    return TraceContextHelper.getTraceId();
  }

  async runInChildSpan<T>(
    traceId: string,
    name: string,
    operation: () => Promise<T>,
    attributes?: Record<string, unknown>,
  ): Promise<T> {
    return this.tracingService.runInSpan(name, operation, {
      attributes: {
        traceId,
        ...(attributes ?? {}),
      },
    });
  }
}
