export type {
  ChatContextChunk,
  ChatRequest,
  ChatResponse,
} from "@rag-platform/contracts";
import type { ChatContextChunk } from "@rag-platform/contracts";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessageModel {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  context?: ChatContextChunk[];
  status?: "idle" | "loading" | "error";
}

export type ConversationMessage = ChatMessageModel;

export interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
  source: "api" | "local";
}

export interface ChatStreamContextPayload {
  question: string;
  conversationId?: number;
  context: ChatContextChunk[];
}

export interface ChatStreamTokenPayload {
  delta: string;
}

export interface ChatStreamDonePayload {
  queryId: number;
  conversationId: number;
  messageId?: number;
  answer: string;
}

export interface SendMessageOptions {
  topK?: number;
  maxContextCharacters?: number;
}
