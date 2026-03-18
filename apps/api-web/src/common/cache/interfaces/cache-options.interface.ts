export interface CacheWrapOptions {
  ttl?: number;
}

export interface CacheableOptions<TArgs extends unknown[] = unknown[]> {
  key?: string;
  ttl?: number;
  keyBuilder?: (...args: TArgs) => string;
}
