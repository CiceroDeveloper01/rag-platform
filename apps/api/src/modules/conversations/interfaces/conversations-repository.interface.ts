import type {
  ConversationMessageRecord,
  ConversationRecord,
} from './conversation-record.interface';

export interface ListConversationsOptions {
  userId: number;
  limit: number;
  offset: number;
}

export interface CreateConversationPayload {
  userId: number;
  title: string;
}

export interface AppendConversationMessagePayload {
  conversationId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ConversationsRepositoryInterface {
  listByUser(options: ListConversationsOptions): Promise<ConversationRecord[]>;
  findById(
    conversationId: number,
    userId: number,
  ): Promise<ConversationRecord | null>;
  create(payload: CreateConversationPayload): Promise<ConversationRecord>;
  appendMessage(
    payload: AppendConversationMessagePayload,
  ): Promise<ConversationMessageRecord>;
  delete(conversationId: number, userId: number): Promise<void>;
  updateTitle(
    conversationId: number,
    userId: number,
    title: string,
  ): Promise<ConversationRecord | null>;
}

export const CONVERSATIONS_REPOSITORY = Symbol('CONVERSATIONS_REPOSITORY');
