import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  enabled: (process.env.DATABASE_ENABLED ?? 'false').toLowerCase() === 'true',
  host: process.env.DATABASE_HOST ?? process.env.DB_HOST ?? 'localhost',
  port: Number.parseInt(
    process.env.DATABASE_PORT ?? process.env.DB_PORT ?? '5433',
    10,
  ),
  username: process.env.DATABASE_USER ?? process.env.DB_USERNAME ?? 'rag',
  password: process.env.DATABASE_PASSWORD ?? process.env.DB_PASSWORD ?? 'rag',
  name: process.env.DATABASE_NAME ?? process.env.DB_NAME ?? 'ragdb',
  schema: process.env.DB_SCHEMA ?? 'public',
  ssl: (process.env.DB_SSL ?? 'false').toLowerCase() === 'true',
  synchronize: (process.env.DB_SYNCHRONIZE ?? 'false').toLowerCase() === 'true',
  logging: (process.env.DB_LOGGING ?? 'false').toLowerCase() === 'true',
}));
