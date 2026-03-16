import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MetricsService } from '../../infra/observability/metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const startedAt = process.hrtime.bigint();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<
      Request & { route?: { path?: string } }
    >();
    const response = httpContext.getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      finalize(() => {
        const durationInSeconds =
          Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
        const labels = {
          method: request.method,
          route: this.resolveRouteLabel(request),
          status_code: String(response.statusCode),
        };

        this.metricsService.recordRequest(labels, durationInSeconds);
      }),
    );
  }

  private resolveRouteLabel(
    request: Request & { route?: { path?: string } },
  ): string {
    const routePath = request.route?.path;

    if (routePath) {
      const normalizedRoutePath = routePath === '/' ? '' : routePath;
      return (
        `${request.baseUrl}${normalizedRoutePath}` || request.baseUrl || '/'
      );
    }

    return request.path ?? request.url.split('?')[0] ?? 'unknown_route';
  }
}
