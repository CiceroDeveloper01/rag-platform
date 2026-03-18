import { createHash } from 'node:crypto';

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortValue(entry));
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        const nestedValue = (value as Record<string, unknown>)[key];

        if (nestedValue !== undefined) {
          accumulator[key] = sortValue(nestedValue);
        }

        return accumulator;
      }, {});
  }

  return value;
}

function toStableString(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export class CacheKeyHelper {
  static build(prefix: string, payload?: unknown): string {
    if (payload === undefined) {
      return prefix;
    }

    const hash = createHash('sha256')
      .update(toStableString(payload))
      .digest('hex');
    return `${prefix}:${hash}`;
  }
}
