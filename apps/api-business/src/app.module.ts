import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { authConfig } from './config/auth.config';
import { aiConfig } from './config/ai.config';
import { appConfig } from './config/app.config';
import { cacheConfig } from './config/cache.config';
import { databaseConfig } from './config/database.config';
import { emailConfig } from './config/email.config';
import { observabilityConfig } from './config/observability.config';
import { omnichannelConfig } from './config/omnichannel.config';
import { omnichannelTelegramConfig } from './config/omnichannel-telegram.config';
import { omnichannelEmailConfig } from './config/omnichannel-email.config';
import { storageConfig } from './config/storage.config';
import { memoryConfig } from './config/memory.config';
import { rabbitMqConfig } from './config/rabbitmq.config';
import { securityConfig } from './config/security.config';
import { validateEnvironment } from './config/environment.validation';
import { AiModule } from './infra/ai/ai.module';
import { LoggerConfigModule } from './common/logger/logger.module';
import { CommonCacheModule } from './common/cache/cache.module';
import { EmailModule } from './common/email/email.module';
import { CommonFeatureFlagsModule } from './common/feature-flags/feature-flags.module';
import { MessagingModule } from './common/messaging/messaging.module';
import { CommonObservabilityModule } from './common/observability/observability.module';
import { StorageModule } from './common/storage/storage.module';
import { DatabaseModule } from './infra/database/database.module';
import { ObservabilityModule } from './infra/observability/observability.module';
import { AuthModule } from './modules/auth/auth.module';
import { BankingModule } from './modules/banking/banking.module';
import { ChatModule } from './modules/chat/chat.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { HealthModule } from './modules/health/health.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { InternalModule } from './modules/internal/internal.module';
import { MemoryModule } from './modules/memory/memory.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [
        appConfig,
        cacheConfig,
        emailConfig,
        authConfig,
        aiConfig,
        databaseConfig,
        observabilityConfig,
        omnichannelConfig,
        omnichannelTelegramConfig,
        omnichannelEmailConfig,
        storageConfig,
        memoryConfig,
        rabbitMqConfig,
        securityConfig,
      ],
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('auth.rateLimit.ttlMs', 60_000),
          limit: configService.get<number>('auth.rateLimit.limit', 120),
        },
      ],
    }),
    CommonCacheModule,
    EmailModule,
    CommonFeatureFlagsModule,
    MessagingModule,
    StorageModule,
    LoggerConfigModule,
    DatabaseModule,
    AiModule,
    ObservabilityModule,
    CommonObservabilityModule,
    // Banking Core
    AuthModule,
    BankingModule,
    ConversationsModule,
    HealthModule,
    // AI Platform Capabilities
    IngestionModule,
    InternalModule,
    MemoryModule,
    DocumentsModule,
    SearchModule,
    ChatModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
