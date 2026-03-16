import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Optional } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { REDIS_CACHE_CLIENT } from '../cache.constants';
import type { CacheWrapOptions } from '../interfaces/cache-options.interface';
import type { RedisCacheClient } from '../interfaces/redis-cache-client.interface';

@Injectable()
export class AppCacheService {
  private readonly trackedKeys = new Set<string>();

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Optional()
    @Inject(REDIS_CACHE_CLIENT)
    private readonly redisClient?: RedisCacheClient | null,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const cachedValue = await this.cacheManager.get<T>(key);
    return cachedValue ?? null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.trackedKeys.add(key);
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    this.trackedKeys.delete(key);
    await this.cacheManager.del(key);
  }

  async wrap<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheWrapOptions,
  ): Promise<T> {
    const cachedValue = await this.get<T>(key);

    if (cachedValue !== null) {
      return cachedValue;
    }

    const computedValue = await factory();
    await this.set(key, computedValue, options?.ttl);
    return computedValue;
  }

  async invalidateByPrefix(prefix: string): Promise<number> {
    if (this.redisClient?.isOpen) {
      const matchingKeys: string[] = [];

      for await (const key of this.redisClient.scanIterator({
        MATCH: `${prefix}*`,
        COUNT: 100,
      })) {
        matchingKeys.push(String(key));
      }

      if (matchingKeys.length > 0) {
        await this.redisClient.del(matchingKeys);
      }

      matchingKeys.forEach((key) => this.trackedKeys.delete(key));
      return matchingKeys.length;
    }

    const matchingKeys = [...this.trackedKeys].filter((key) =>
      key.startsWith(prefix),
    );

    await Promise.all(matchingKeys.map((key) => this.del(key)));

    return matchingKeys.length;
  }
}
