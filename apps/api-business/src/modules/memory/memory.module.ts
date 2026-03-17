import { Module } from '@nestjs/common';
import { ConversationMemoryPostgresRepository } from './repositories/conversation-memory-postgres.repository';
import { ConversationMemoryService } from './services/conversation-memory.service';
import { CONVERSATION_MEMORY_REPOSITORY } from './interfaces/conversation-memory-repository.interface';

@Module({
  providers: [
    ConversationMemoryService,
    ConversationMemoryPostgresRepository,
    {
      provide: CONVERSATION_MEMORY_REPOSITORY,
      useExisting: ConversationMemoryPostgresRepository,
    },
  ],
  exports: [ConversationMemoryService, CONVERSATION_MEMORY_REPOSITORY],
})
export class MemoryModule {}
