import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { setupApplication } from './../src/common/setup/application.setup';
import { HealthService } from './../src/modules/health/health.service';
import { MetricsService } from './../src/infra/observability/metrics.service';

describe('Application (e2e)', () => {
  let app: INestApplication;
  let healthService: HealthService;
  let metricsService: MetricsService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApplication(app);
    await app.init();
    healthService = app.get(HealthService);
    metricsService = app.get(MetricsService);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should expose the health payload', () => {
    return expect(healthService.check()).resolves.toEqual(
      expect.objectContaining({
        status: expect.stringMatching(/^(ok|degraded)$/),
        timestamp: expect.any(String),
        readiness: expect.objectContaining({
          database: expect.any(String),
          redis: expect.any(String),
          storage: expect.any(String),
          rag: expect.any(String),
          email: expect.any(String),
        }),
      }),
    );
  });

  it('should expose Prometheus metrics output', async () => {
    metricsService.recordRequest(
      {
        method: 'GET',
        route: '/health',
        status_code: '200',
      },
      0.01,
    );

    await expect(metricsService.getMetrics()).resolves.toContain(
      'rag_platform_api_http_requests_total',
    );
  });
});
