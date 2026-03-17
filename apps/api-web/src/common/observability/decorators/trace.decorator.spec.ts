import { Trace } from './trace.decorator';
import { ObservabilityAccessor } from '../services/observability-accessor.service';

describe('@Trace', () => {
  afterEach(() => {
    ObservabilityAccessor.set(null as never);
  });

  it('wraps successful method execution in a trace operation', async () => {
    const trace = jest.fn(
      async (_name: string, operation: () => Promise<unknown>) => operation(),
    );
    ObservabilityAccessor.set({ trace } as never);

    class TestService {
      @Trace('test.trace.success')
      async execute(): Promise<string> {
        return 'ok';
      }
    }

    const service = new TestService();
    await expect(service.execute()).resolves.toBe('ok');
    expect(trace).toHaveBeenCalledWith(
      'test.trace.success',
      expect.any(Function),
      expect.objectContaining({
        name: 'test.trace.success',
        attributes: expect.objectContaining({
          class: 'TestService',
          method: 'execute',
        }),
      }),
    );
  });

  it('propagates method errors', async () => {
    const trace = jest.fn(
      async (_name: string, operation: () => Promise<unknown>) => operation(),
    );
    ObservabilityAccessor.set({ trace } as never);

    class TestService {
      @Trace('test.trace.error')
      async execute(): Promise<string> {
        throw new Error('boom');
      }
    }

    const service = new TestService();
    await expect(service.execute()).rejects.toThrow('boom');
    expect(trace).toHaveBeenCalled();
  });
});
