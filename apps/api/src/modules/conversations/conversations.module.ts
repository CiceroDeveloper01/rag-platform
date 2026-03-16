import { Module } from '@nestjs/common';
import { ObservabilityModule } from '../../infra/observability/observability.module';
import { ConversationsController } from './controllers/conversations.controller';
import { CONVERSATIONS_REPOSITORY } from './interfaces/conversations-repository.interface';
import { ConversationsPostgresRepository } from './repositories/conversations-postgres.repository';
import { ConversationsService } from './services/conversations.service';

@Module({
  imports: [ObservabilityModule],
  controllers: [ConversationsController],
  providers: [
    ConversationsService,
    ConversationsPostgresRepository,
    {
      provide: CONVERSATIONS_REPOSITORY,
      useExisting: ConversationsPostgresRepository,
    },
  ],
  exports: [ConversationsService, CONVERSATIONS_REPOSITORY],
})
export class ConversationsModule {}
