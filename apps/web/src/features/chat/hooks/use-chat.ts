"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { env } from "@/src/lib/constants/app";
import { chatApiService } from "../services/chat-api.service";
import { conversationsApiService } from "../services/conversations-api.service";
import type {
  ChatMessageModel,
  Conversation,
  SendMessageOptions,
} from "../types/chat.types";
import { createChatMessage } from "../utils/create-chat-message";

const DEFAULT_SYSTEM_MESSAGE = createChatMessage(
  "system",
  "O chat esta conectado ao pipeline RAG do backend. As respostas podem chegar em streaming e incluem o contexto recuperado.",
);

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<ChatMessageModel[]>([
    DEFAULT_SYSTEM_MESSAGE,
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const activeRequest = useRef<AbortController | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const activeConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const response = await conversationsApiService.listConversations();

        if (!isMounted) {
          return;
        }

        setConversations(response.conversations);
        setActiveConversationId(response.activeConversationId);
        conversationsRef.current = response.conversations;
        activeConversationIdRef.current = response.activeConversationId;

        const activeConversation = response.conversations.find(
          (conversation) =>
            String(conversation.id) === response.activeConversationId,
        );

        setMessages(
          activeConversation?.messages.length
            ? activeConversation.messages
            : [DEFAULT_SYSTEM_MESSAGE],
        );
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    }

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const lastAssistantMessage = useMemo(
    () =>
      [...messages].reverse().find((message) => message.role === "assistant"),
    [messages],
  );

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => String(conversation.id) === activeConversationId,
      ) ?? null,
    [activeConversationId, conversations],
  );

  async function persistConversation(
    nextMessages: ChatMessageModel[],
    question?: string,
  ) {
    let conversationId = activeConversationIdRef.current;
    let conversation =
      conversationsRef.current.find(
        (item) => String(item.id) === conversationId,
      ) ?? activeConversation;

    if (!conversationId || !conversation) {
      conversation = await conversationsApiService.createConversation(question);
      conversationId = String(conversation.id);
      activeConversationIdRef.current = String(conversation.id);
      setActiveConversationId(String(conversation.id));
      setConversations((current) => {
        const next = [conversation!, ...current];
        conversationsRef.current = next;
        return next;
      });
    }

    const nextConversation: Conversation = {
      ...(conversation as Conversation),
      title:
        conversation?.title === "Nova conversa" && question
          ? question.slice(0, 42) + (question.length > 42 ? "..." : "")
          : (conversation?.title ?? "Nova conversa"),
      updatedAt: new Date().toISOString(),
      messages: nextMessages,
      source: conversation?.source ?? "local",
    };

    await conversationsApiService.saveConversation(nextConversation);
    setConversations((current) => {
      const next = [
        nextConversation,
        ...current.filter((item) => item.id !== nextConversation.id),
      ];
      conversationsRef.current = next;
      return next;
    });
    setActiveConversationId(String(nextConversation.id));
    activeConversationIdRef.current = String(nextConversation.id);
  }

  async function sendQuestion(question: string, options?: SendMessageOptions) {
    setError(null);
    setMessages((current) =>
      current.map((message) =>
        message.status === "loading"
          ? {
              ...message,
              status: "error" as const,
              content:
                message.content ||
                "Resposta interrompida para iniciar uma nova consulta.",
            }
          : message,
      ),
    );
    activeRequest.current?.abort();

    const userMessage = createChatMessage("user", question);
    const loadingMessage = createChatMessage("assistant", "", {
      status: "loading",
    });
    const requestController = new AbortController();
    activeRequest.current = requestController;

    const seededMessages = [...messages, userMessage, loadingMessage];
    setMessages(seededMessages);
    await persistConversation(seededMessages, question);
    setIsPending(true);

    const payload = {
      question,
      topK: options?.topK ?? 5,
      maxContextCharacters: options?.maxContextCharacters ?? 6000,
      conversationId: activeConversationIdRef.current
        ? Number(activeConversationIdRef.current)
        : undefined,
    };

    try {
      if (env.chatStreamingEnabled) {
        await chatApiService.streamQuestion(payload, {
          signal: requestController.signal,
          onContext: (streamPayload) => {
            setMessages((current) => {
              const next = current.map((message) =>
                message.id === loadingMessage.id
                  ? {
                      ...message,
                      context: streamPayload.context,
                    }
                  : message,
              );
              void persistConversation(next, question);
              return next;
            });
          },
          onToken: (streamPayload) => {
            setMessages((current) => {
              const next = current.map((message) =>
                message.id === loadingMessage.id
                  ? {
                      ...message,
                      content: `${message.content}${streamPayload.delta}`,
                    }
                  : message,
              );
              void persistConversation(next, question);
              return next;
            });
          },
          onDone: (streamPayload) => {
            setMessages((current) => {
              const next = current.map((message) =>
                message.id === loadingMessage.id
                  ? {
                      ...message,
                      content: streamPayload.answer,
                      status: "idle" as const,
                    }
                  : message,
              );
              void persistConversation(next, question);
              return next;
            });
          },
          onError: (message) => {
            throw new Error(message);
          },
        });
      } else {
        const response = await chatApiService.askQuestion(payload);

        setMessages((current) => {
          const next = current.map((message) =>
            message.id === loadingMessage.id
              ? {
                  ...message,
                  content: response.answer,
                  context: response.context,
                  status: "idle" as const,
                }
              : message,
          );
          void persistConversation(next, question);
          return next;
        });
      }
    } catch (requestError) {
      if (requestController.signal.aborted) {
        return;
      }

      const message =
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel concluir a consulta.";

      console.error("[chat] request failed", requestError);
      setError(message);
      setMessages((current) => {
        const next = current.map((entry) =>
          entry.id === loadingMessage.id
            ? {
                ...entry,
                content: entry.content || message,
                status: "error" as const,
              }
            : entry,
        );
        void persistConversation(next, question);
        return next;
      });
    } finally {
      if (activeRequest.current === requestController) {
        activeRequest.current = null;
      }
      setIsPending(false);
    }
  }

  function stopStreaming() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setMessages((current) => {
      const next = current.map((message) =>
        message.status === "loading"
          ? {
              ...message,
              status: "error" as const,
              content: message.content || "Streaming interrompido manualmente.",
            }
          : message,
      );
      void persistConversation(next);
      return next;
    });
    setIsPending(false);
  }

  function startNewConversation() {
    const nextMessages = [
      createChatMessage("system", DEFAULT_SYSTEM_MESSAGE.content),
    ];
    setActiveConversationId(null);
    activeConversationIdRef.current = null;
    setMessages(nextMessages);
    setError(null);
  }

  function openConversation(conversationId: string) {
    const conversation = conversations.find(
      (item) => String(item.id) === conversationId,
    );

    if (!conversation) {
      return;
    }

    conversationsApiService.setActiveConversation(conversationId);
    setActiveConversationId(conversationId);
    activeConversationIdRef.current = conversationId;
    setMessages(
      conversation.messages.length
        ? conversation.messages
        : [DEFAULT_SYSTEM_MESSAGE],
    );
    setError(null);
  }

  async function deleteConversation(conversationId: string) {
    await conversationsApiService.deleteConversation(Number(conversationId));
    setConversations((current) =>
      current.filter((item) => String(item.id) !== conversationId),
    );

    if (activeConversationId === conversationId) {
      startNewConversation();
    }
  }

  return {
    conversations,
    activeConversationId,
    messages,
    activeConversation,
    error,
    isPending,
    isLoadingHistory,
    lastAssistantMessage,
    sendQuestion,
    stopStreaming,
    startNewConversation,
    openConversation,
    deleteConversation,
  };
}
