import { registerAs } from '@nestjs/config';

export const businessApiConfig = registerAs('businessApi', () => ({
  baseUrl: process.env.API_BUSINESS_BASE_URL ?? 'http://localhost:3000',
  timeoutMs: Number.parseInt(process.env.API_BUSINESS_TIMEOUT_MS ?? '10000', 10),
}));
