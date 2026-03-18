import { ConversationMemoryRecord } from './conversation-memory-record.interface';

export interface StoreConversationMemoryPayload {
  tenantId: string;
  channel: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  message: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface QueryConversationMemoryPayload {
  tenantId: string;
  channel: string;
  conversationId: string;
  now: Date;
  recentLimit: number;
  semanticLimit: number;
  queryEmbedding: number[];
}

export interface ConversationMemoryRepositoryInterface {
  store(
    payload: StoreConversationMemoryPayload,
  ): Promise<ConversationMemoryRecord>;
  findRecent(
    payload: QueryConversationMemoryPayload,
  ): Promise<ConversationMemoryRecord[]>;
  findSimilar(
    payload: QueryConversationMemoryPayload,
  ): Promise<ConversationMemoryRecord[]>;
  trimConversation(
    tenantId: string,
    channel: string,
    conversationId: string,
    keepLatest: number,
  ): Promise<void>;
  purgeExpired(now: Date): Promise<number>;
}

export const CONVERSATION_MEMORY_REPOSITORY = Symbol(
  'CONVERSATION_MEMORY_REPOSITORY',
);
