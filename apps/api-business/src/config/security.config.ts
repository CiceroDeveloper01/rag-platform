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
  internalService: {
    secret:
      process.env.INTERNAL_SERVICE_TOKEN_SECRET ??
      'dev-internal-service-token-secret',
    issuer:
      process.env.INTERNAL_SERVICE_TOKEN_ISSUER ?? 'rag-platform-internal',
    audience:
      process.env.INTERNAL_SERVICE_TOKEN_AUDIENCE ?? 'rag-platform-api-business',
    allowedSubjects: parseScopes(
      process.env.INTERNAL_SERVICE_ALLOWED_SUBJECTS,
      ['service-api-web', 'service-orchestrator'],
    ),
    clockSkewSeconds: Number.parseInt(
      process.env.INTERNAL_SERVICE_CLOCK_SKEW_SECONDS ?? '30',
      10,
    ),
  },
}));
