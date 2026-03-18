import { registerAs } from '@nestjs/config';

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
}

export const cacheConfig = registerAs('cache', () => ({
  redis: {
    enabled: toBoolean(process.env.REDIS_ENABLED, false),
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
    username: process.env.REDIS_USERNAME ?? '',
    password: process.env.REDIS_PASSWORD ?? '',
    db: Number.parseInt(process.env.REDIS_DB ?? '0', 10),
  },
  defaultTtl: Number.parseInt(process.env.REDIS_TTL_DEFAULT ?? '30', 10),
}));
