import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MetricsService } from '../../../infra/observability/metrics.service';
import { ExecutionContextHelper } from '../helpers/execution-context.helper';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

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

    return next.handle().pipe(
      finalize(() => {
        const durationInSeconds =
          Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;

        this.metricsService.recordRequest(
          {
            method: request.method,
            route: ExecutionContextHelper.resolveRoute(request),
            status_code: String(response.statusCode),
          },
          durationInSeconds,
        );
      }),
    );
  }
}
