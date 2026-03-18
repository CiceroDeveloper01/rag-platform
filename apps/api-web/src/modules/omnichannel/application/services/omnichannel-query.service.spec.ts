import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { AppCacheService } from '../../../../common/cache/services/app-cache.service';
import { FeatureFlagsService } from '../../../../common/feature-flags/feature-flags.service';
import { OMNICHANNEL_CLOCK_SERVICE } from '../interfaces/clock-service.interface';
import { OMNICHANNEL_CORRELATION_SERVICE } from '../interfaces/correlation-service.interface';
import { OMNICHANNEL_DASHBOARD_QUERY_REPOSITORY } from '../interfaces/omnichannel-dashboard-query-repository.interface';
import { OMNICHANNEL_METRICS_SERVICE } from '../interfaces/metrics-service.interface';
import { OMNICHANNEL_TRACE_SERVICE } from '../interfaces/trace-service.interface';
import { OmnichannelQueryService } from './omnichannel-query.service';
import { MessageChannel } from '../../domain/enums/message-channel.enum';

describe('OmnichannelQueryService', () => {
  const queryRepository = {
    getOverview: jest.fn(),
    listRequests: jest.fn(),
    getRequestDetails: jest.fn(),
    listExecutions: jest.fn(),
    getExecutionDetails: jest.fn(),
    getChannelMetrics: jest.fn(),
    getLatencyMetrics: jest.fn(),
    getRagUsageMetrics: jest.fn(),
    listConnectors: jest.fn(),
  };
  const metricsService = {
    recordDashboardQuery: jest.fn(),
    observeDashboardLatency: jest.fn(),
  };
  const traceService = {
    startSpan: jest.fn().mockReturnValue({
      traceId: 'trace-1',
      spanId: 'span-1',
      end: jest.fn(),
    }),
    getCurrentTraceId: jest.fn().mockReturnValue('trace-1'),
  };
  const correlationService = {
    create: jest.fn().mockReturnValue('corr-1'),
  };
  const clockService = {
    now: jest.fn(),
  };
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  };
  const featureFlagsService = {
    isDashboardEnabled: jest.fn().mockReturnValue(true),
    recordDisabledHit: jest.fn(),
  };
  const cacheStore = new Map<string, unknown>();
  const appCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    invalidateByPrefix: jest.fn(),
    wrap: jest.fn(async (key: string, factory: () => Promise<unknown>) => {
      if (cacheStore.has(key)) {
        return cacheStore.get(key);
      }

      const value = await factory();
      cacheStore.set(key, value);
      return value;
    }),
  };

  let service: OmnichannelQueryService;

  beforeEach(async () => {
    jest.clearAllMocks();
    cacheStore.clear();
    clockService.now.mockImplementation(
      () => new Date('2026-03-13T10:00:00.050Z'),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        OmnichannelQueryService,
        {
          provide: OMNICHANNEL_DASHBOARD_QUERY_REPOSITORY,
          useValue: queryRepository,
        },
        {
          provide: OMNICHANNEL_METRICS_SERVICE,
          useValue: metricsService,
        },
        {
          provide: AppCacheService,
          useValue: appCacheService,
        },
        {
          provide: FeatureFlagsService,
          useValue: featureFlagsService,
        },
        {
          provide: OMNICHANNEL_TRACE_SERVICE,
          useValue: traceService,
        },
        {
          provide: OMNICHANNEL_CORRELATION_SERVICE,
          useValue: correlationService,
        },
        {
          provide: OMNICHANNEL_CLOCK_SERVICE,
          useValue: clockService,
        },
        {
          provide: PinoLogger,
          useValue: logger,
        },
      ],
    }).compile();

    service = moduleRef.get(OmnichannelQueryService);
  });

  it('returns the dashboard overview and records telemetry', async () => {
    queryRepository.getOverview.mockResolvedValue({
      totalRequests: 12,
      successCount: 10,
      errorCount: 2,
      avgLatencyMs: 80,
      p95LatencyMs: 120,
      ragUsagePercentage: 50,
      activeConnectors: 2,
      requestsLast24h: 5,
      requestsLast7d: 11,
      channels: [],
    });

    await expect(service.getOverview({}, 'tenant-a')).resolves.toEqual(
      expect.objectContaining({
        totalRequests: 12,
      }),
    );
    expect(queryRepository.getOverview).toHaveBeenCalledWith({}, 'tenant-a');
    expect(metricsService.recordDashboardQuery).toHaveBeenCalledWith(
      'overview',
      'success',
    );
  });

  it('returns paginated requests from the query repository', async () => {
    queryRepository.listRequests.mockResolvedValue({
      items: [
        {
          id: 1,
          channel: MessageChannel.TELEGRAM,
          conversationId: '123',
          senderName: 'User',
          senderAddress: 'user',
          normalizedTextPreview: 'preview',
          status: 'PROCESSED',
          receivedAt: new Date('2026-03-13T10:00:00.000Z'),
          processedAt: new Date('2026-03-13T10:00:01.000Z'),
          latencyMs: 100,
          usedRag: true,
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    });

    await expect(
      service.listRequests({ limit: 20, offset: 0 }, 'tenant-a'),
    ).resolves.toEqual(
      expect.objectContaining({
        pagination: expect.objectContaining({
          total: 1,
        }),
      }),
    );
    expect(queryRepository.listRequests).toHaveBeenCalledWith(
      { limit: 20, offset: 0 },
      'tenant-a',
    );
  });

  it('uses different cache keys for different dashboard request filters', async () => {
    queryRepository.listRequests.mockResolvedValue({
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
    });

    await service.listRequests(
      {
        limit: 20,
        offset: 0,
        channel: MessageChannel.TELEGRAM,
      },
      'tenant-a',
    );
    await service.listRequests(
      {
        limit: 20,
        offset: 0,
        channel: MessageChannel.EMAIL,
      },
      'tenant-a',
    );

    expect(appCacheService.wrap).toHaveBeenCalledTimes(2);
    expect(appCacheService.wrap.mock.calls[0]?.[0]).not.toEqual(
      appCacheService.wrap.mock.calls[1]?.[0],
    );
  });

  it('uses different cache keys for different tenants', async () => {
    queryRepository.getOverview.mockResolvedValue({
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      avgLatencyMs: 0,
      p95LatencyMs: 0,
      ragUsagePercentage: 0,
      activeConnectors: 0,
      requestsLast24h: 0,
      requestsLast7d: 0,
      channels: [],
    });

    await service.getOverview({}, 'tenant-a');
    await service.getOverview({}, 'tenant-b');

    expect(appCacheService.wrap.mock.calls[0]?.[0]).not.toEqual(
      appCacheService.wrap.mock.calls[1]?.[0],
    );
  });
});
