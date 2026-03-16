import { ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { MetricsService } from '../../../infra/observability/metrics.service';
import { MetricsInterceptor } from './metrics.interceptor';

describe('MetricsInterceptor', () => {
  it('records HTTP metrics for a request', async () => {
    const metricsService = {
      recordRequest: jest.fn(),
    } as unknown as MetricsService;

    const interceptor = new MetricsInterceptor(metricsService);
    const request = {
      method: 'GET',
      path: '/health',
      url: '/health',
      baseUrl: '',
      route: { path: '/health' },
    };
    const response = { statusCode: 200 };
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;

    await lastValueFrom(
      interceptor.intercept(context, { handle: () => of('ok') }),
    );

    expect(metricsService.recordRequest).toHaveBeenCalledWith(
      {
        method: 'GET',
        route: '/health',
        status_code: '200',
      },
      expect.any(Number),
    );
  });
});
