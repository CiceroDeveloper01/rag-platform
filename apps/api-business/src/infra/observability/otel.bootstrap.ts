import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';

function isTelemetryEnabled(): boolean {
  return (process.env.OTEL_ENABLED ?? 'true').toLowerCase() === 'true';
}

function parseResourceAttributes(attributes: string): Record<string, string> {
  return attributes
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((accumulator, entry) => {
      const [key, ...valueParts] = entry.split('=');

      if (!key || valueParts.length === 0) {
        return accumulator;
      }

      accumulator[key.trim()] = valueParts.join('=').trim();
      return accumulator;
    }, {});
}

export async function bootstrapOpenTelemetry(): Promise<NodeSDK | null> {
  if (!isTelemetryEnabled()) {
    return null;
  }

  const serviceName =
    process.env.OTEL_SERVICE_NAME ?? process.env.APP_NAME ?? 'rag-platform-api';
  const serviceVersion =
    process.env.OTEL_SERVICE_VERSION ??
    process.env.APP_VERSION ??
    process.env.npm_package_version ??
    '0.0.1';
  const environment = process.env.NODE_ENV ?? 'development';
  const endpoint = (
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318'
  ).replace(/\/$/, '');
  const resourceAttributes = parseResourceAttributes(
    process.env.OTEL_RESOURCE_ATTRIBUTES ?? '',
  );

  if (environment !== 'production') {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);
  }

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: serviceVersion,
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: environment,
      ...resourceAttributes,
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
      }),
    ],
  });

  await sdk.start();
  return sdk;
}
