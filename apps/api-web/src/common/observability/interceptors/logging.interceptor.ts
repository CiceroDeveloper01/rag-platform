import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ExecutionContextHelper } from '../helpers/execution-context.helper';
import { TraceContextHelper } from '../helpers/trace-context.helper';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!ExecutionContextHelper.isHttp(context)) {
      return next.handle();
    }

    const request = ExecutionContextHelper.getHttpRequest(context);
    const response = context
      .switchToHttp()
      .getResponse<{ statusCode: number }>();

    if (!request) {
      return next.handle();
    }

    const startedAt = process.hrtime.bigint();
    const route = ExecutionContextHelper.resolveRoute(request);
    const traceContext = TraceContextHelper.getContext();

    this.logger.info({
      event: 'http.request.start',
      method: request.method,
      route,
      requestId: traceContext.requestId,
      correlationId: traceContext.correlationId,
      traceId: traceContext.traceId,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.info({
            event: 'http.request.finish',
            method: request.method,
            route,
            statusCode: response.statusCode,
            durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
            requestId: traceContext.requestId,
            correlationId: traceContext.correlationId,
            traceId: TraceContextHelper.getTraceId(),
          });
        },
        error: (error: unknown) => {
          this.logger.error({
            event: 'http.request.error',
            method: request.method,
            route,
            statusCode: response.statusCode,
            durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
            requestId: traceContext.requestId,
            correlationId: traceContext.correlationId,
            traceId: TraceContextHelper.getTraceId(),
            error:
              error instanceof Error ? error.message : 'http_request_failed',
          });
        },
      }),
    );
  }
}
