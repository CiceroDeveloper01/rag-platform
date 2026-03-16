import { MetricTimer } from './metric-timer.decorator';
import { ObservabilityAccessor } from '../services/observability-accessor.service';

describe('@MetricTimer', () => {
  afterEach(() => {
    ObservabilityAccessor.set(null as never);
  });

  it('records duration for successful method execution', async () => {
    const time = jest.fn(async (_options, operation: () => Promise<unknown>) =>
      operation(),
    );
    ObservabilityAccessor.set({ time } as never);

    class TestService {
      @MetricTimer('custom_duration_ms')
      async execute(): Promise<string> {
        return 'timed';
      }
    }

    const service = new TestService();
    await expect(service.execute()).resolves.toBe('timed');
    expect(time).toHaveBeenCalledWith(
      expect.objectContaining({
        metricName: 'custom_duration_ms',
        labels: expect.objectContaining({
          class: 'TestService',
          method: 'execute',
        }),
      }),
      expect.any(Function),
    );
  });
});
