import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { TraceContextHelper } from '../observability/helpers/trace-context.helper';

export const pinoLoggerOptions = (configService: ConfigService): Params => {
  const redactEnabled = configService.get<boolean>(
    'observability.redactSensitiveLogs',
    true,
  );
  const prettyLogs = configService.get<boolean>(
    'observability.prettyLogs',
    false,
  );

  return {
    pinoHttp: {
      level: configService.get<string>('observability.logLevel', 'info'),
      messageKey: 'message',
      autoLogging: true,
      genReqId: (req) =>
        (Array.isArray(req.headers['x-request-id'])
          ? req.headers['x-request-id'][0]
          : req.headers['x-request-id']) ??
        req.id ??
        randomUUID(),
      redact: redactEnabled
        ? {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'res.headers["set-cookie"]',
              'password',
              '*.password',
              '*.token',
            ],
            remove: true,
          }
        : undefined,
      customProps: (req) => ({
        context: 'HTTP',
        requestId: req.id,
        correlationId:
          TraceContextHelper.getCorrelationId() ??
          (Array.isArray(req.headers['x-correlation-id'])
            ? req.headers['x-correlation-id'][0]
            : req.headers['x-correlation-id']),
        traceId: TraceContextHelper.getTraceId(),
        service: configService.get<string>(
          'observability.otelServiceName',
          'rag-platform-api',
        ),
        environment: configService.get<string>('app.env', 'development'),
      }),
      transport: prettyLogs
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
              translateTime: 'SYS:standard',
            },
          }
        : undefined,
    },
  };
};
