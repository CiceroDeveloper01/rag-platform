import { firstValueFrom } from 'rxjs';
import { FeatureFlagsService } from '../../../../common/feature-flags/feature-flags.service';
import { ObservabilityMetricsService } from '../../../../common/observability/services/metrics.service';
import { ExecutionActivityStreamService } from './execution-activity-stream.service';

describe('ExecutionActivityStreamService', () => {
  const metricsService = {
    incrementCounter: jest.fn(),
    setGauge: jest.fn(),
  } as unknown as ObservabilityMetricsService;
  const featureFlagsService = {
    isLiveActivityEnabled: jest.fn().mockReturnValue(true),
    recordDisabledHit: jest.fn(),
  } as unknown as FeatureFlagsService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('publishes events to subscribers', async () => {
    const service = new ExecutionActivityStreamService(
      metricsService,
      featureFlagsService,
    );
    const eventPromise = firstValueFrom(service.stream());

    service.publish({
      executionId: 10,
      type: 'execution_started',
      eventType: 'execution_started',
      message: 'Execution started',
      color: 'blue',
      icon: 'play',
      severity: 'info',
      timestamp: '2026-03-13T10:00:00.000Z',
      channel: 'EMAIL',
      metadata: { channel: 'EMAIL' },
    });

    await expect(eventPromise).resolves.toEqual({
      executionId: 10,
      type: 'execution_started',
      eventType: 'execution_started',
      message: 'Execution started',
      color: 'blue',
      icon: 'play',
      severity: 'info',
      timestamp: '2026-03-13T10:00:00.000Z',
      channel: 'EMAIL',
      metadata: { channel: 'EMAIL' },
    });
  });

  it('tracks stream connections and disconnects', () => {
    const service = new ExecutionActivityStreamService(
      metricsService,
      featureFlagsService,
    );
    const subscription = service.stream().subscribe();

    expect(metricsService.incrementCounter as jest.Mock).toHaveBeenCalledWith(
      'live_activity_stream_connections_total',
      {},
      1,
      expect.any(String),
    );
    expect(metricsService.setGauge as jest.Mock).toHaveBeenCalledWith(
      'live_activity_stream_subscribers',
      1,
      {},
      expect.any(String),
    );

    subscription.unsubscribe();

    expect(metricsService.incrementCounter as jest.Mock).toHaveBeenCalledWith(
      'live_activity_stream_disconnects_total',
      {},
      1,
      expect.any(String),
    );
    expect(metricsService.setGauge as jest.Mock).toHaveBeenCalledWith(
      'live_activity_stream_subscribers',
      0,
      {},
      expect.any(String),
    );
  });
});
