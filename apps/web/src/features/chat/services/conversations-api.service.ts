import { optionalApiRequest } from "@/src/lib/api/api-client";
import type { Conversation, ConversationMessage } from "../types/chat.types";

const STORAGE_KEY = "rag-platform.chat.conversations";
const ACTIVE_STORAGE_KEY = "rag-platform.chat.active-conversation";

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeMessages(
  messages: Array<Record<string, unknown>> | undefined,
): ConversationMessage[] {
  if (!messages) {
    return [];
  }

  return messages.map((message) => ({
    id: String(message.id),
    role: (message.role as "user" | "assistant" | "system") ?? "assistant",
    content: String(message.content ?? ""),
    createdAt: String(
      message.createdAt ?? message.created_at ?? new Date().toISOString(),
    ),
    status: "idle",
  }));
}

function normalizeConversation(payload: Record<string, unknown>): Conversation {
  return {
    id: Number(payload.id),
    title: String(payload.title ?? "Conversation"),
    createdAt: String(
      payload.createdAt ?? payload.created_at ?? new Date().toISOString(),
    ),
    updatedAt: String(
      payload.updatedAt ?? payload.updated_at ?? new Date().toISOString(),
    ),
    messages: normalizeMessages(
      payload.messages as Array<Record<string, unknown>> | undefined,
    ),
    source: "api",
  };
}

function readLocalConversations(): Conversation[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

function writeLocalConversations(conversations: Conversation[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

function getActiveConversationId(): string | null {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_STORAGE_KEY);
}

function setActiveConversationId(conversationId: string) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(ACTIVE_STORAGE_KEY, conversationId);
}

function createConversationTitle(question: string) {
  const normalized = question.trim();
  return normalized.length > 42 ? `${normalized.slice(0, 42)}...` : normalized;
}

function createConversation(question?: string): Conversation {
  const now = new Date().toISOString();

  return {
    id: Date.now(),
    title: question ? createConversationTitle(question) : "Nova conversa",
    createdAt: now,
    updatedAt: now,
    messages: [],
    source: "local",
  };
}

export const conversationsApiService = {
  async listConversations(): Promise<{
    conversations: Conversation[];
    activeConversationId: string | null;
  }> {
    const apiConversations =
      await optionalApiRequest<Array<Record<string, unknown>>>(
        "/conversations",
      );

    if (apiConversations) {
      const conversations = apiConversations.map(normalizeConversation);

      return {
        conversations,
        activeConversationId: conversations[0]
          ? String(conversations[0].id)
          : null,
      };
    }

    const conversations = readLocalConversations();
    return {
      conversations,
      activeConversationId:
        getActiveConversationId() ??
        (conversations[0] ? String(conversations[0].id) : null),
    };
  },

  async createConversation(question?: string): Promise<Conversation> {
    const apiConversation = await optionalApiRequest<Record<string, unknown>>(
      "/conversations",
      {
        method: "POST",
        body: JSON.stringify({
          title: question ? createConversationTitle(question) : "Nova conversa",
        }),
      },
    );

    if (apiConversation) {
      return normalizeConversation(apiConversation);
    }

    const next = createConversation(question);
    const current = readLocalConversations();
    const conversations = [next, ...current];
    writeLocalConversations(conversations);
    setActiveConversationId(String(next.id));
    return next;
  },

  async saveConversation(conversation: Conversation): Promise<Conversation> {
    const current = readLocalConversations();
    const next = [
      conversation,
      ...current.filter((item) => item.id !== conversation.id),
    ].sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() -
        new Date(left.updatedAt).getTime(),
    );
    writeLocalConversations(next);
    setActiveConversationId(String(conversation.id));
    return conversation;
  },

  async appendMessages(
    conversationId: number,
    messages: ConversationMessage[],
  ): Promise<Conversation | null> {
    const current = readLocalConversations();
    const conversation = current.find((item) => item.id === conversationId);

    if (!conversation) {
      return null;
    }

    const nextConversation: Conversation = {
      ...conversation,
      updatedAt: new Date().toISOString(),
      messages,
    };

    await this.saveConversation(nextConversation);
    return nextConversation;
  },

  async deleteConversation(conversationId: number): Promise<void> {
    const apiResponse = await optionalApiRequest<{ success: boolean }>(
      `/conversations/${String(conversationId)}`,
      {
        method: "DELETE",
      },
    );

    if (apiResponse) {
      return;
    }

    const current = readLocalConversations();
    writeLocalConversations(
      current.filter((item) => item.id !== conversationId),
    );
  },

  async getConversation(conversationId: number): Promise<Conversation | null> {
    const apiConversation = await optionalApiRequest<Record<string, unknown>>(
      `/conversations/${String(conversationId)}`,
    );

    if (apiConversation) {
      return normalizeConversation(apiConversation);
    }

    return (
      readLocalConversations().find((item) => item.id === conversationId) ??
      null
    );
  },

  setActiveConversation(conversationId: string) {
    setActiveConversationId(conversationId);
  },
};
