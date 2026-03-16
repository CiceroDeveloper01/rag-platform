export interface ConversationMemoryRecord {
  id: string | number;
  tenantId: string;
  channel: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  message: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  similarity?: number;
}
