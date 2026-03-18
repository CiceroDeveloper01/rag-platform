export interface TraceSpan {
  traceId: string;
  spanId: string;
  end(status: 'success' | 'error', attributes?: Record<string, unknown>): void;
}

export interface ITraceService {
  startSpan(name: string, attributes?: Record<string, unknown>): TraceSpan;
  getCurrentTraceId(): string | undefined;
  runInChildSpan<T>(
    traceId: string,
    name: string,
    operation: () => Promise<T>,
    attributes?: Record<string, unknown>,
  ): Promise<T>;
}

export const OMNICHANNEL_TRACE_SERVICE = Symbol('OMNICHANNEL_TRACE_SERVICE');
