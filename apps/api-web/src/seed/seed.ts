import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(SeedModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  try {
    await app.get(SeedService).run();
  } finally {
    await app.close();
  }
}

void bootstrap();
