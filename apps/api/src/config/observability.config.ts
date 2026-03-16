import { registerAs } from '@nestjs/config';

export const observabilityConfig = registerAs('observability', () => ({
  metricsPrefix: process.env.METRICS_PREFIX ?? 'rag_platform_api_',
  collectDefaultMetrics:
    (process.env.METRICS_DEFAULTS_ENABLED ?? 'true').toLowerCase() === 'true',
  otelEnabled: (process.env.OTEL_ENABLED ?? 'true').toLowerCase() === 'true',
  otlpEndpoint:
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318',
  otelServiceName:
    process.env.OTEL_SERVICE_NAME ?? process.env.APP_NAME ?? 'rag-platform-api',
  otelServiceVersion:
    process.env.OTEL_SERVICE_VERSION ??
    process.env.APP_VERSION ??
    process.env.npm_package_version ??
    '0.0.1',
  otelResourceAttributes: process.env.OTEL_RESOURCE_ATTRIBUTES ?? '',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  prettyLogs:
    (
      process.env.LOG_PRETTY ??
      (process.env.NODE_ENV === 'development' ? 'true' : 'false')
    ).toLowerCase() === 'true',
  redactSensitiveLogs:
    (process.env.LOG_REDACT_ENABLED ?? 'true').toLowerCase() === 'true',
}));
