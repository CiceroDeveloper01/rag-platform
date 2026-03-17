import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ExecutionContextHelper } from '../helpers/execution-context.helper';
import { TraceContextHelper } from '../helpers/trace-context.helper';
import { TracingService } from '../services/tracing.service';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  constructor(private readonly tracingService: TracingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!ExecutionContextHelper.isHttp(context)) {
      return next.handle();
    }

    const request = ExecutionContextHelper.getHttpRequest(context);

    if (!request) {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse<Response>();
    const route = ExecutionContextHelper.resolveRoute(request);
    const requestId = this.resolveRequestId(request);
    const correlationId = this.resolveCorrelationId(request, requestId);
    const span = this.tracingService.createSpan('http.request', {
      'http.method': request.method,
      'http.route': route,
      correlationId,
      requestId,
    });

    const spanContext = span.spanContext();

    response.setHeader('x-request-id', requestId);
    response.setHeader('x-correlation-id', correlationId);
    response.setHeader('x-trace-id', spanContext.traceId);

    return TraceContextHelper.runWithContext(
      {
        requestId,
        correlationId,
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
        method: request.method,
        route,
      },
      () =>
        this.tracingService.withSpanContext(span, () =>
          next.handle().pipe(
            tap({
              next: () => {
                this.tracingService.setSuccess(span, {
                  'http.status_code': response.statusCode,
                });
              },
              error: (error: unknown) => {
                this.tracingService.setError(span, error, {
                  'http.status_code': response.statusCode,
                });
              },
            }),
          ),
        ),
    );
  }

  private resolveRequestId(request: Request & { id?: string }): string {
    const requestIdHeader = Array.isArray(request.headers['x-request-id'])
      ? request.headers['x-request-id'][0]
      : request.headers['x-request-id'];

    return requestIdHeader ?? request.id ?? randomUUID();
  }

  private resolveCorrelationId(request: Request, requestId: string): string {
    const correlationIdHeader = Array.isArray(
      request.headers['x-correlation-id'],
    )
      ? request.headers['x-correlation-id'][0]
      : request.headers['x-correlation-id'];

    return correlationIdHeader ?? requestId;
  }
}
