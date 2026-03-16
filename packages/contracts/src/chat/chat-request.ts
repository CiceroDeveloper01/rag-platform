export interface ChatRequest {
  question: string;
  topK?: number;
  stream?: boolean;
  maxContextCharacters?: number;
  conversationId?: number;
}
