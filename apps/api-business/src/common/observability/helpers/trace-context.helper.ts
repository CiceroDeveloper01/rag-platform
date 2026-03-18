import { AsyncLocalStorage } from 'node:async_hooks';
import { context as otelContext, trace } from '@opentelemetry/api';

export interface TraceRequestContext {
  requestId?: string;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  method?: string;
  route?: string;
}

export class TraceContextHelper {
  private static readonly storage =
    new AsyncLocalStorage<TraceRequestContext>();

  static runWithContext<T>(context: TraceRequestContext, callback: () => T): T {
    const current = this.storage.getStore() ?? {};
    return this.storage.run({ ...current, ...context }, callback);
  }

  static set(values: Partial<TraceRequestContext>): void {
    const current = this.storage.getStore();

    if (!current) {
      return;
    }

    Object.assign(current, values);
  }

  static getContext(): TraceRequestContext {
    const current = this.storage.getStore() ?? {};
    const activeSpan = trace.getSpan(otelContext.active());
    const spanContext = activeSpan?.spanContext();

    return {
      ...current,
      traceId: current.traceId ?? spanContext?.traceId,
      spanId: current.spanId ?? spanContext?.spanId,
    };
  }

  static getRequestId(): string | undefined {
    return this.getContext().requestId;
  }

  static getCorrelationId(): string | undefined {
    return this.getContext().correlationId;
  }

  static getTraceId(): string | undefined {
    return this.getContext().traceId;
  }

  static getSpanId(): string | undefined {
    return this.getContext().spanId;
  }
}
