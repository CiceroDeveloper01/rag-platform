import { ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { TracingInterceptor } from './tracing.interceptor';
import { TracingService } from '../services/tracing.service';

describe('TracingInterceptor', () => {
  const buildContext = () =>
    ({
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          path: '/metrics',
          url: '/metrics',
          baseUrl: '',
          route: { path: '/metrics' },
          headers: {},
          id: 'req-1',
        }),
        getResponse: () => ({
          statusCode: 200,
          setHeader: jest.fn(),
        }),
      }),
    }) as unknown as ExecutionContext;

  it('marks span success on successful request', (done) => {
    const span = {
      spanContext: () => ({ traceId: 'trace-1', spanId: 'span-1' }),
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      end: jest.fn(),
    };
    const tracingService = {
      createSpan: jest.fn(() => span),
      withSpanContext: jest.fn((_span, operation) => operation()),
      setSuccess: jest.fn(),
      setError: jest.fn(),
    } as unknown as TracingService;

    const interceptor = new TracingInterceptor(tracingService);
    interceptor
      .intercept(buildContext(), { handle: () => of('ok') })
      .subscribe({
        complete: () => {
          expect(tracingService.createSpan).toHaveBeenCalledWith(
            'http.request',
            expect.objectContaining({
              'http.method': 'GET',
              'http.route': '/metrics',
            }),
          );
          expect(tracingService.setSuccess).toHaveBeenCalled();
          done();
        },
      });
  });

  it('marks span error on failed request', (done) => {
    const span = {
      spanContext: () => ({ traceId: 'trace-1', spanId: 'span-1' }),
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      end: jest.fn(),
    };
    const tracingService = {
      createSpan: jest.fn(() => span),
      withSpanContext: jest.fn((_span, operation) => operation()),
      setSuccess: jest.fn(),
      setError: jest.fn(),
    } as unknown as TracingService;

    const interceptor = new TracingInterceptor(tracingService);
    interceptor
      .intercept(buildContext(), {
        handle: () => throwError(() => new Error('fail')),
      })
      .subscribe({
        error: () => {
          expect(tracingService.setError).toHaveBeenCalled();
          done();
        },
      });
  });
});
