export interface ConversationMemoryRecord {
  id: number;
  tenantId: string;
  channel: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  expiresAt: Date | null;
  similarity?: number;
}
