import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { MetricTimer } from '../../../common/observability/decorators/metric-timer.decorator';
import { Trace } from '../../../common/observability/decorators/trace.decorator';
import { CONVERSATION_MEMORY_REPOSITORY } from '../interfaces/conversation-memory-repository.interface';
import type { ConversationMemoryRepositoryInterface } from '../interfaces/conversation-memory-repository.interface';
import { ConversationMemoryRecord } from '../interfaces/conversation-memory-record.interface';

@Injectable()
export class ConversationMemoryService {
  constructor(
    @Inject(CONVERSATION_MEMORY_REPOSITORY)
    private readonly repository: ConversationMemoryRepositoryInterface,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ConversationMemoryService.name);
  }

  @Trace('memory.service.store')
  @MetricTimer({
    metricName: 'conversation_memory_store_duration_ms',
    labels: { module: 'memory' },
  })
  async storeMessage(payload: {
    tenantId: string;
    channel: string;
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    message: string;
    embedding: number[];
    metadata?: Record<string, unknown>;
    createdAt?: string;
  }): Promise<ConversationMemoryRecord> {
    try {
      const stored = await this.repository.store({
        tenantId: payload.tenantId,
        channel: payload.channel,
        conversationId: payload.conversationId,
        role: payload.role,
        message: this.normalizeMessage(payload.message),
        embedding: payload.embedding,
        metadata: payload.metadata,
        createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
        expiresAt: this.computeExpiration(payload.createdAt),
      });

      await this.repository.trimConversation(
        payload.tenantId,
        payload.channel,
        payload.conversationId,
        this.maxMessagesPerConversation(),
      );
      await this.repository.purgeExpired(new Date());

      this.logger.info(
        {
          tenantId: payload.tenantId,
          channel: payload.channel,
          conversationId: payload.conversationId,
          role: payload.role,
          memoryId: stored.id,
        },
        'Conversation memory stored',
      );

      return stored;
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to store conversation memory');
      throw new ServiceUnavailableException(
        'Conversation memory persistence is unavailable',
      );
    }
  }

  @Trace('memory.service.query_context')
  @MetricTimer({
    metricName: 'conversation_memory_query_duration_ms',
    labels: { module: 'memory' },
  })
  async queryContext(payload: {
    tenantId: string;
    channel: string;
    conversationId: string;
    queryEmbedding: number[];
    recentLimit?: number;
    semanticLimit?: number;
    now?: string;
  }): Promise<{
    recentMessages: ConversationMemoryRecord[];
    semanticMemories: ConversationMemoryRecord[];
  }> {
    try {
      const now = payload.now ? new Date(payload.now) : new Date();
      const queryPayload = {
        tenantId: payload.tenantId,
        channel: payload.channel,
        conversationId: payload.conversationId,
        queryEmbedding: payload.queryEmbedding,
        now,
        recentLimit: payload.recentLimit ?? this.defaultRecentLimit(),
        semanticLimit: payload.semanticLimit ?? this.defaultSemanticLimit(),
      };

      const [recentMessages, semanticMemories] = await Promise.all([
        this.repository.findRecent(queryPayload),
        this.repository.findSimilar(queryPayload),
      ]);

      this.logger.debug(
        {
          tenantId: payload.tenantId,
          channel: payload.channel,
          conversationId: payload.conversationId,
          recentCount: recentMessages.length,
          semanticCount: semanticMemories.length,
        },
        'Conversation memory context retrieved',
      );

      return {
        recentMessages,
        semanticMemories,
      };
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to query conversation memory');
      throw new ServiceUnavailableException(
        'Conversation memory retrieval is unavailable',
      );
    }
  }

  private normalizeMessage(message: string): string {
    const normalized = message.trim();
    const maxChars = this.maxMessageChars();

    if (normalized.length <= maxChars) {
      return normalized;
    }

    return normalized.slice(0, maxChars);
  }

  private computeExpiration(createdAt?: string): Date | null {
    const retentionDays = this.retentionDays();

    if (retentionDays <= 0) {
      return null;
    }

    const baseDate = createdAt ? new Date(createdAt) : new Date();
    const expiresAt = new Date(baseDate);
    expiresAt.setUTCDate(expiresAt.getUTCDate() + retentionDays);
    return expiresAt;
  }

  private defaultRecentLimit(): number {
    return this.configService.get<number>('memory.recentLimit', 8) ?? 8;
  }

  private defaultSemanticLimit(): number {
    return this.configService.get<number>('memory.semanticLimit', 5) ?? 5;
  }

  private retentionDays(): number {
    return this.configService.get<number>('memory.retentionDays', 30) ?? 30;
  }

  private maxMessageChars(): number {
    return (
      this.configService.get<number>('memory.maxMessageChars', 4000) ?? 4000
    );
  }

  private maxMessagesPerConversation(): number {
    return (
      this.configService.get<number>(
        'memory.maxMessagesPerConversation',
        200,
      ) ?? 200
    );
  }
}
