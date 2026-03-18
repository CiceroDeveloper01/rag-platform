import { registerAs } from "@nestjs/config";

function parseScopes(value: string | undefined, fallback: string[]) {
  if (!value) {
    return fallback;
  }

  return value
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

export const securityConfig = registerAs("security", () => ({
  internalService: {
    secret:
      process.env.INTERNAL_SERVICE_TOKEN_SECRET ??
      "dev-internal-service-token-secret",
    issuer:
      process.env.INTERNAL_SERVICE_TOKEN_ISSUER ?? "rag-platform-internal",
    audience:
      process.env.INTERNAL_SERVICE_TOKEN_AUDIENCE ??
      "rag-platform-api-business",
    subject: process.env.INTERNAL_SERVICE_SUBJECT ?? "service-orchestrator",
    defaultScopes: parseScopes(process.env.INTERNAL_SERVICE_DEFAULT_SCOPES, [
      "internal:conversations:write",
      "internal:documents:write",
      "internal:handoff:write",
      "internal:ingestion:write",
      "internal:memory:write",
    ]),
    ttlSeconds: Number.parseInt(
      process.env.INTERNAL_SERVICE_TOKEN_TTL_SECONDS ?? "300",
      10,
    ),
  },
}));
