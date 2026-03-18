import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { MetricsService } from '../../infra/observability/metrics.service';
import { FeatureFlagsService } from './feature-flags.service';

describe('FeatureFlagsService', () => {
  const metricsService = {
    incrementCustomCounter: jest.fn(),
  };
  const logger = {
    setContext: jest.fn(),
    warn: jest.fn(),
  };

  it('returns true when a feature flag is enabled', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        FeatureFlagsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'FEATURE_RAG_ENABLED' ? 'true' : undefined,
            ),
          },
        },
        {
          provide: MetricsService,
          useValue: metricsService,
        },
        {
          provide: PinoLogger,
          useValue: logger,
        },
      ],
    }).compile();

    const service = moduleRef.get(FeatureFlagsService);
    expect(service.isRagEnabled()).toBe(true);
  });

  it('returns false when a feature flag is disabled', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        FeatureFlagsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'FEATURE_LIVE_ACTIVITY_ENABLED' ? 'false' : undefined,
            ),
          },
        },
        {
          provide: MetricsService,
          useValue: metricsService,
        },
        {
          provide: PinoLogger,
          useValue: logger,
        },
      ],
    }).compile();

    const service = moduleRef.get(FeatureFlagsService);
    expect(service.isLiveActivityEnabled()).toBe(false);
  });
});
