import { registerAs } from '@nestjs/config';

function parseScopes(value: string | undefined, fallback: string[]) {
  if (!value) {
    return fallback;
  }

  return value
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

export const securityConfig = registerAs('security', () => ({
  userJwt: {
    secret: process.env.AUTH_USER_JWT_SECRET ?? 'dev-user-jwt-secret',
    issuer: process.env.AUTH_USER_JWT_ISSUER ?? 'rag-platform-api-web',
    audience: process.env.AUTH_USER_JWT_AUDIENCE ?? 'rag-platform-web',
    ttlMinutes: Number.parseInt(
      process.env.AUTH_USER_JWT_TTL_MINUTES ?? '60',
      10,
    ),
  },
  internalService: {
    secret:
      process.env.INTERNAL_SERVICE_TOKEN_SECRET ??
      'dev-internal-service-token-secret',
    issuer:
      process.env.INTERNAL_SERVICE_TOKEN_ISSUER ?? 'rag-platform-internal',
    audience:
      process.env.INTERNAL_SERVICE_TOKEN_AUDIENCE ?? 'rag-platform-api-business',
    subject:
      process.env.INTERNAL_SERVICE_SUBJECT ?? 'service-api-web',
    defaultScopes: parseScopes(process.env.INTERNAL_SERVICE_DEFAULT_SCOPES, [
      'business:documents:read',
      'business:documents:write',
    ]),
    ttlSeconds: Number.parseInt(
      process.env.INTERNAL_SERVICE_TOKEN_TTL_SECONDS ?? '300',
      10,
    ),
  },
}));
