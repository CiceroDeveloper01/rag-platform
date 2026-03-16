import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { GlobalExceptionFilter } from '../filters/global-exception.filter';

export function setupApplication(app: INestApplication): void {
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string[]>('app.frontendOrigins', [
      'http://localhost:3000',
    ]),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );
  app.use((request: Request, response: Response, next: NextFunction) => {
    const requestId = Array.isArray(request.headers['x-request-id'])
      ? request.headers['x-request-id'][0]
      : request.headers['x-request-id'];

    if (requestId) {
      response.setHeader('x-request-id', requestId);
    }

    next();
  });

  app.useGlobalFilters(new GlobalExceptionFilter(app.get(Logger)));
  app.enableShutdownHooks();
}
