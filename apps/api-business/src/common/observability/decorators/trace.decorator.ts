import { TraceOptions } from '../interfaces/trace-options.interface';
import { ObservabilityAccessor } from '../services/observability-accessor.service';

function buildTraceOptions(input?: string | TraceOptions): TraceOptions {
  if (!input) {
    return {};
  }

  if (typeof input === 'string') {
    return { name: input };
  }

  return input;
}

function serializeArgs(
  args: unknown[],
): Record<string, string | number | boolean> {
  return {
    count: args.length,
    types: args
      .map((arg) => (Array.isArray(arg) ? 'array' : typeof arg))
      .join(','),
  };
}

export function Trace(input?: string | TraceOptions): MethodDecorator {
  const options = buildTraceOptions(input);

  return (
    _target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

    descriptor.value = async function tracedMethod(...args: unknown[]) {
      const observabilityService = ObservabilityAccessor.get();

      if (!observabilityService) {
        return originalMethod.apply(this, args);
      }

      const spanName =
        options.name ??
        `${this?.constructor?.name ?? 'UnknownClass'}.${String(propertyKey)}`;

      return observabilityService.trace(
        spanName,
        async () => originalMethod.apply(this, args),
        {
          ...options,
          attributes: {
            class: this?.constructor?.name ?? 'UnknownClass',
            method: String(propertyKey),
            ...(options.includeArgs ? serializeArgs(args) : {}),
            ...(options.attributes ?? {}),
          },
        },
      );
    };

    return descriptor;
  };
}
