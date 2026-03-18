import { Injectable } from '@nestjs/common';
import { ConversationMemoryService } from '../../memory/services/conversation-memory.service';
import { QueryMemoryContextRequest } from './dtos/request/query-memory-context.request';
import { StoreMemoryRequest } from './dtos/request/store-memory.request';

@Injectable()
export class InternalMemoryService {
  constructor(
    private readonly conversationMemoryService: ConversationMemoryService,
  ) {}

  async store(dto: StoreMemoryRequest) {
    const memory = await this.conversationMemoryService.storeMessage(dto);

    return {
      success: true as const,
      memoryId: memory.id,
    };
  }

  async queryContext(dto: QueryMemoryContextRequest) {
    const context = await this.conversationMemoryService.queryContext(dto);

    return {
      recentMessages: context.recentMessages.map((memory) => ({
        id: memory.id,
        tenantId: memory.tenantId,
        channel: memory.channel,
        conversationId: memory.conversationId,
        role: memory.role,
        message: memory.message,
        createdAt: memory.createdAt.toISOString(),
        metadata: memory.metadata,
        similarity: memory.similarity,
      })),
      semanticMemories: context.semanticMemories.map((memory) => ({
        id: memory.id,
        tenantId: memory.tenantId,
        channel: memory.channel,
        conversationId: memory.conversationId,
        role: memory.role,
        message: memory.message,
        createdAt: memory.createdAt.toISOString(),
        metadata: memory.metadata,
        similarity: memory.similarity,
      })),
    };
  }
}
