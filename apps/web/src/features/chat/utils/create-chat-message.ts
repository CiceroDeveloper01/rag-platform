import type { ChatMessageModel, ChatRole } from "../types/chat.types";

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createChatMessage(
  role: ChatRole,
  content: string,
  partial?: Partial<ChatMessageModel>,
): ChatMessageModel {
  return {
    id: createId(),
    role,
    content,
    createdAt: new Date().toISOString(),
    status: "idle",
    ...partial,
  };
}
