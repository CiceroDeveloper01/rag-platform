import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  sessionTtlHours: Number.parseInt(
    process.env.AUTH_SESSION_TTL_HOURS ?? '8',
    10,
  ),
  sessionCookieName:
    process.env.AUTH_SESSION_COOKIE_NAME ?? 'rag_platform_session',
  secureCookies: process.env.AUTH_SECURE_COOKIES === 'true',
  rateLimit: {
    ttlMs: Number.parseInt(process.env.AUTH_RATE_LIMIT_TTL_MS ?? '60000', 10),
    limit: Number.parseInt(process.env.AUTH_RATE_LIMIT_LIMIT ?? '60', 10),
  },
  demoUser: {
    email: process.env.DEMO_USER_EMAIL ?? 'demo@ragplatform.dev',
    password: process.env.DEMO_USER_PASSWORD ?? 'demo123',
    fullName: process.env.DEMO_USER_NAME ?? 'Demo Operator',
  },
}));
