import { TraceContextHelper } from './trace-context.helper';

describe('TraceContextHelper', () => {
  it('stores and reads request-scoped context', () => {
    TraceContextHelper.runWithContext(
      {
        requestId: 'req-1',
        correlationId: 'corr-1',
        traceId: 'trace-1',
        spanId: 'span-1',
      },
      () => {
        expect(TraceContextHelper.getRequestId()).toBe('req-1');
        expect(TraceContextHelper.getCorrelationId()).toBe('corr-1');
        expect(TraceContextHelper.getTraceId()).toBe('trace-1');
        expect(TraceContextHelper.getSpanId()).toBe('span-1');
      },
    );
  });
});
