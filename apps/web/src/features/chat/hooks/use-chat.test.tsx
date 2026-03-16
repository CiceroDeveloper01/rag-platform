import { act, renderHook, waitFor } from "@testing-library/react";
import { env } from "@/src/lib/constants/app";
import { useChat } from "./use-chat";
import { chatApiService } from "../services/chat-api.service";
import { conversationsApiService } from "../services/conversations-api.service";

vi.mock("../services/chat-api.service", () => ({
  chatApiService: {
    askQuestion: vi.fn(),
    streamQuestion: vi.fn(),
  },
}));

vi.mock("../services/conversations-api.service", () => ({
  conversationsApiService: {
    listConversations: vi.fn(),
    createConversation: vi.fn(),
    saveConversation: vi.fn(),
    deleteConversation: vi.fn(),
    setActiveConversation: vi.fn(),
  },
}));

describe("useChat", () => {
  const originalStreamingEnabled = env.chatStreamingEnabled;

  beforeEach(() => {
    vi.clearAllMocks();
    env.chatStreamingEnabled = originalStreamingEnabled;
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.mocked(conversationsApiService.listConversations).mockResolvedValue({
      conversations: [],
      activeConversationId: null,
    });
    vi.mocked(conversationsApiService.createConversation).mockResolvedValue({
      id: 1,
      title: "Nova conversa",
      createdAt: "2026-03-13T12:00:00.000Z",
      updatedAt: "2026-03-13T12:00:00.000Z",
      messages: [],
      source: "local",
    });
    vi.mocked(conversationsApiService.saveConversation).mockImplementation(
      async (conversation) => conversation,
    );
    vi.mocked(chatApiService.askQuestion).mockResolvedValue({
      queryId: 501,
      conversationId: 1,
      messageId: 87,
      answer: "pgvector adds vector similarity search to PostgreSQL.",
      context: [
        {
          id: 1,
          content: "pgvector extends PostgreSQL with vector search support.",
          metadata: null,
          distance: 0.14,
        },
      ],
    });
    vi.mocked(chatApiService.streamQuestion).mockImplementation(
      async (_payload, options) => {
        options.onContext?.({
          question: "What is pgvector?",
          conversationId: 1,
          context: [
            {
              id: 1,
              content:
                "pgvector extends PostgreSQL with vector search support.",
              metadata: null,
              distance: 0.14,
            },
          ],
        });
        options.onDone?.({
          queryId: 501,
          conversationId: 1,
          messageId: 87,
          answer: "pgvector adds vector similarity search to PostgreSQL.",
        });
      },
    );
  });

  afterAll(() => {
    env.chatStreamingEnabled = originalStreamingEnabled;
  });

  it("loads persisted history on mount", async () => {
    vi.mocked(conversationsApiService.listConversations).mockResolvedValueOnce({
      conversations: [
        {
          id: 22,
          title: "Existing chat",
          createdAt: "2026-03-13T12:00:00.000Z",
          updatedAt: "2026-03-13T12:05:00.000Z",
          source: "api",
          messages: [
            {
              id: "assistant-1",
              role: "assistant",
              content: "Recovered answer",
              createdAt: "2026-03-13T12:01:00.000Z",
              status: "idle",
            },
          ],
        },
      ],
      activeConversationId: "22",
    });

    const { result } = renderHook(() => useChat());

    await waitFor(() => expect(result.current.isLoadingHistory).toBe(false));

    expect(result.current.activeConversationId).toBe("22");
    expect(result.current.messages).toEqual([
      expect.objectContaining({
        role: "assistant",
        content: "Recovered answer",
      }),
    ]);
  });

  it("sends a chat message and updates the assistant response in streaming mode", async () => {
    const { result } = renderHook(() => useChat());

    await waitFor(() => expect(result.current.isLoadingHistory).toBe(false));

    await act(async () => {
      await result.current.sendQuestion("What is pgvector?", { topK: 7 });
    });

    expect(chatApiService.streamQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        question: "What is pgvector?",
        topK: 7,
      }),
      expect.any(Object),
    );
    expect(result.current.error).toBeNull();
    expect(result.current.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "user",
          content: "What is pgvector?",
        }),
        expect.objectContaining({
          role: "assistant",
          content: "pgvector adds vector similarity search to PostgreSQL.",
          status: "idle",
          context: [expect.objectContaining({ id: 1 })],
        }),
      ]),
    );
  });

  it("surfaces API failures in the hook state and marks the assistant message as error", async () => {
    vi.mocked(chatApiService.streamQuestion).mockRejectedValueOnce(
      new Error("Chat backend failed"),
    );

    const { result } = renderHook(() => useChat());

    await waitFor(() => expect(result.current.isLoadingHistory).toBe(false));

    await act(async () => {
      await result.current.sendQuestion("Will this fail?");
    });

    expect(result.current.error).toBe("Chat backend failed");
    expect(result.current.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "assistant",
          status: "error",
          content: "Chat backend failed",
        }),
      ]),
    );
  });

  it("falls back to the non-streaming request path when streaming is disabled", async () => {
    env.chatStreamingEnabled = false;

    const { result } = renderHook(() => useChat());

    await waitFor(() => expect(result.current.isLoadingHistory).toBe(false));

    await act(async () => {
      await result.current.sendQuestion("What is pgvector?");
    });

    expect(chatApiService.askQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        question: "What is pgvector?",
      }),
    );
    expect(result.current.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "assistant",
          content: "pgvector adds vector similarity search to PostgreSQL.",
          status: "idle",
        }),
      ]),
    );
  });

  it("opens and deletes persisted conversations", async () => {
    vi.mocked(conversationsApiService.listConversations).mockResolvedValueOnce({
      conversations: [
        {
          id: 22,
          title: "Existing chat",
          createdAt: "2026-03-13T12:00:00.000Z",
          updatedAt: "2026-03-13T12:05:00.000Z",
          source: "api",
          messages: [
            {
              id: "assistant-1",
              role: "assistant",
              content: "Recovered answer",
              createdAt: "2026-03-13T12:01:00.000Z",
              status: "idle",
            },
          ],
        },
        {
          id: 23,
          title: "Second chat",
          createdAt: "2026-03-13T12:00:00.000Z",
          updatedAt: "2026-03-13T12:05:00.000Z",
          source: "api",
          messages: [
            {
              id: "assistant-2",
              role: "assistant",
              content: "Another answer",
              createdAt: "2026-03-13T12:01:00.000Z",
              status: "idle",
            },
          ],
        },
      ],
      activeConversationId: "22",
    });

    const { result } = renderHook(() => useChat());

    await waitFor(() => expect(result.current.isLoadingHistory).toBe(false));

    act(() => {
      result.current.openConversation("23");
    });

    expect(conversationsApiService.setActiveConversation).toHaveBeenCalledWith(
      "23",
    );
    expect(result.current.activeConversationId).toBe("23");
    expect(result.current.messages).toEqual([
      expect.objectContaining({
        content: "Another answer",
      }),
    ]);

    await act(async () => {
      await result.current.deleteConversation("23");
    });

    expect(conversationsApiService.deleteConversation).toHaveBeenCalledWith(23);
    expect(result.current.activeConversationId).toBeNull();
  });
});
