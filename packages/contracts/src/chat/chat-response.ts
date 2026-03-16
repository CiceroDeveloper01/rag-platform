import type { ChatContextChunk } from "./chat-context-chunk";

export interface ChatResponse {
  queryId: number;
  conversationId: number;
  messageId?: number;
  answer: string;
  context: ChatContextChunk[];
}
