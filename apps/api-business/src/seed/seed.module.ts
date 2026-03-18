import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from '../config/app.config';
import { authConfig } from '../config/auth.config';
import { cacheConfig } from '../config/cache.config';
import { databaseConfig } from '../config/database.config';
import { observabilityConfig } from '../config/observability.config';
import { storageConfig } from '../config/storage.config';
import { validateEnvironment } from '../config/environment.validation';
import { LoggerConfigModule } from '../common/logger/logger.module';
import { DatabaseModule } from '../infra/database/database.module';
import { SeedService } from './seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [
        appConfig,
        authConfig,
        cacheConfig,
        databaseConfig,
        observabilityConfig,
        storageConfig,
      ],
      validate: validateEnvironment,
    }),
    LoggerConfigModule,
    DatabaseModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
