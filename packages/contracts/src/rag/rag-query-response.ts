import type { ChatContextChunk } from "../chat/chat-context-chunk";

export interface RagQueryResponse {
  question: string;
  contexts: ChatContextChunk[];
}
