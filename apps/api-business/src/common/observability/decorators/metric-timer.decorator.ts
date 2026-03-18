import { MetricOptions } from '../interfaces/metric-options.interface';
import { ObservabilityAccessor } from '../services/observability-accessor.service';

function buildMetricOptions(
  input: string | MetricOptions,
  targetName: string,
  propertyKey: string | symbol,
): MetricOptions {
  if (typeof input === 'string') {
    return {
      metricName: input,
      labels: {
        class: targetName,
        method: String(propertyKey),
      },
    };
  }

  return {
    ...input,
    labels: {
      class: targetName,
      method: String(propertyKey),
      ...(input.labels ?? {}),
    },
  };
}

export function MetricTimer(input: string | MetricOptions): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;
    const targetName = target.constructor?.name ?? 'UnknownClass';

    descriptor.value = async function timedMethod(...args: unknown[]) {
      const observabilityService = ObservabilityAccessor.get();

      if (!observabilityService) {
        return originalMethod.apply(this, args);
      }

      const options = buildMetricOptions(input, targetName, propertyKey);

      return observabilityService.time(options, async () =>
        originalMethod.apply(this, args),
      );
    };

    return descriptor;
  };
}
