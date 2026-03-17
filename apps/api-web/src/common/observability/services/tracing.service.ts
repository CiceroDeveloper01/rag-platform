import { Injectable } from '@nestjs/common';
import {
  context as otelContext,
  SpanStatusCode,
  trace,
  type Attributes,
  type Span,
  type Tracer,
} from '@opentelemetry/api';
import { TraceOptions } from '../interfaces/trace-options.interface';
import { TraceContextHelper } from '../helpers/trace-context.helper';

@Injectable()
export class TracingService {
  private readonly tracer: Tracer = trace.getTracer('rag-platform.application');

  async runInSpan<T>(
    name: string,
    operation: () => Promise<T> | T,
    options?: TraceOptions,
  ): Promise<T> {
    return this.tracer.startActiveSpan(
      name,
      {
        attributes: this.toAttributes(options?.attributes),
      },
      async (span) => {
        this.syncTraceContext(span);

        try {
          const result = await operation();

          if (options?.includeResult) {
            this.applySerializedMetadata(span, 'result', result);
          }

          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          span.recordException(error as Error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'unknown_error',
          });
          throw error;
        } finally {
          span.end();
        }
      },
    );
  }

  createSpan(name: string, attributes?: Record<string, unknown>): Span {
    const span = this.tracer.startSpan(name, {
      attributes: this.toAttributes(attributes),
    });
    this.syncTraceContext(span);
    return span;
  }

  withSpanContext<T>(span: Span, operation: () => T): T {
    const contextWithSpan = trace.setSpan(otelContext.active(), span);
    return otelContext.with(contextWithSpan, operation);
  }

  setSuccess(span: Span, attributes?: Record<string, unknown>): void {
    span.setAttributes(this.toAttributes(attributes) ?? {});
    span.setStatus({ code: SpanStatusCode.OK });
  }

  setError(
    span: Span,
    error: unknown,
    attributes?: Record<string, unknown>,
  ): void {
    span.setAttributes(this.toAttributes(attributes) ?? {});
    if (error instanceof Error) {
      span.recordException(error);
    }
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'unknown_error',
    });
  }

  getActiveTraceContext(): ReturnType<typeof TraceContextHelper.getContext> {
    return TraceContextHelper.getContext();
  }

  private syncTraceContext(span: Span): void {
    const spanContext = span.spanContext();

    TraceContextHelper.set({
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
    });
  }

  private applySerializedMetadata(
    span: Span,
    prefix: string,
    value: unknown,
  ): void {
    const serialized = this.serializeValue(value);

    Object.entries(serialized).forEach(([key, entryValue]) => {
      span.setAttribute(`${prefix}.${key}`, entryValue);
    });
  }

  private serializeValue(
    value: unknown,
  ): Record<string, string | number | boolean> {
    if (value === null || value === undefined) {
      return { value: 'null' };
    }

    if (typeof value === 'string') {
      return { preview: value.slice(0, 256) };
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return { value };
    }

    if (Array.isArray(value)) {
      return { length: value.length };
    }

    if (typeof value === 'object') {
      return {
        keys: Object.keys(value as Record<string, unknown>)
          .join(',')
          .slice(0, 256),
      };
    }

    return { type: typeof value };
  }

  private toAttributes(
    attributes?: Record<string, unknown>,
  ): Attributes | undefined {
    if (!attributes) {
      return undefined;
    }

    return Object.entries(attributes).reduce<Attributes>(
      (accumulator, [key, value]) => {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          accumulator[key] = value;
        }

        return accumulator;
      },
      {},
    );
  }
}
