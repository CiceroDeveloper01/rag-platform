import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { WsAdapter } from '@nestjs/platform-ws';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { setupApplication } from './common/setup/application.setup';
import { bootstrapOpenTelemetry } from './infra/observability/otel.bootstrap';

async function bootstrap(): Promise<void> {
  const telemetrySdk = await bootstrapOpenTelemetry();
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.useWebSocketAdapter(new WsAdapter(app));
  setupApplication(app);

  const configService = app.get(ConfigService);
  const swaggerConfig = new DocumentBuilder()
    .setTitle('RAG Platform API')
    .setDescription(
      'Backend API for the RAG Platform, including omnichannel orchestration, RAG workflows, dashboard queries, documents, conversations, and health endpoints.',
    )
    .setVersion(configService.get<string>('app.version', '0.0.1'))
    .addCookieAuth(
      configService.get<string>(
        'auth.sessionCookieName',
        'rag_platform_session',
      ),
      {
        type: 'apiKey',
        in: 'cookie',
      },
    )
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, swaggerDocument, {
    customSiteTitle: 'RAG Platform API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = configService.getOrThrow<number>('app.port');
  await app.listen(port, '0.0.0.0');

  const logger = app.get(Logger);
  logger.log(`API listening on http://0.0.0.0:${String(port)}`, 'Bootstrap');

  if (telemetrySdk) {
    const shutdownTelemetry = async (): Promise<void> => {
      await telemetrySdk.shutdown().catch((error: unknown) => {
        logger.error(
          { err: error },
          'OpenTelemetry shutdown failed',
          'Bootstrap',
        );
      });
    };

    process.once('SIGINT', () => void shutdownTelemetry());
    process.once('SIGTERM', () => void shutdownTelemetry());
  }
}

void bootstrap();
