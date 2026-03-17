import { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';

export function parseCookieHeader(
  cookieHeader?: string,
): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((accumulator, entry) => {
      const separatorIndex = entry.indexOf('=');

      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();

      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});
}

export function buildSessionCookieOptions(
  configService: ConfigService,
  expiresAt?: Date,
): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: configService.get<boolean>('auth.secureCookies', false),
    expires: expiresAt,
    path: '/',
  };
}
