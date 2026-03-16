import { apiRequest, streamSse } from "@/src/lib/api/api-client";
import type {
  ChatRequest,
  ChatResponse,
  ChatStreamContextPayload,
  ChatStreamDonePayload,
  ChatStreamTokenPayload,
} from "../types/chat.types";

export const chatApiService = {
  async askQuestion(payload: ChatRequest) {
    return apiRequest<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async streamQuestion(
    payload: ChatRequest,
    options: {
      signal?: AbortSignal;
      onContext?: (payload: ChatStreamContextPayload) => void;
      onToken?: (payload: ChatStreamTokenPayload) => void;
      onDone?: (payload: ChatStreamDonePayload) => void;
      onError?: (message: string) => void;
    },
  ) {
    await streamSse<
      | ChatStreamContextPayload
      | ChatStreamTokenPayload
      | ChatStreamDonePayload
      | { message: string }
    >({
      path: "/chat",
      signal: options.signal,
      init: {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          stream: true,
        }),
      },
      onEvent: (event) => {
        if (event.event === "context") {
          options.onContext?.(event.data as ChatStreamContextPayload);
          return;
        }

        if (event.event === "token") {
          options.onToken?.(event.data as ChatStreamTokenPayload);
          return;
        }

        if (event.event === "done") {
          options.onDone?.(event.data as ChatStreamDonePayload);
          return;
        }

        if (event.event === "error") {
          const payload = event.data as { message?: string };
          options.onError?.(payload.message ?? "Streaming failed.");
        }
      },
      onJsonFallback: async ({ payload: jsonPayload }) => {
        const response = jsonPayload as ChatResponse;
        options.onContext?.({
          question: payload.question,
          context: response.context,
        });
        options.onDone?.({
          queryId: response.queryId,
          conversationId: response.conversationId,
          messageId: response.messageId,
          answer: response.answer,
        });
      },
    });
  },
};
