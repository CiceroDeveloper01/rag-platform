import { registerAs } from '@nestjs/config';

const DEFAULT_API_VERSION = 'v1';

export const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'rag-platform-api',
  env: process.env.NODE_ENV ?? 'development',
  port: Number.parseInt(process.env.PORT ?? '3001', 10),
  version:
    process.env.APP_VERSION ?? process.env.npm_package_version ?? '0.0.1',
  apiPrefix: process.env.API_PREFIX ?? DEFAULT_API_VERSION,
  frontendOrigins: (process.env.FRONTEND_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}));
