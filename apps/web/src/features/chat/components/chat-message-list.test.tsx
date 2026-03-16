import { render, screen } from "@testing-library/react";
import { ChatMessageList } from "./chat-message-list";

describe("ChatMessageList", () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("renders the empty state when there are no user or assistant messages", () => {
    render(
      <ChatMessageList
        messages={[
          {
            id: "system-1",
            role: "system",
            content: "System prompt",
            createdAt: "2026-03-13T12:00:00.000Z",
            status: "idle",
          },
        ]}
        isStreaming={false}
      />,
    );

    expect(
      screen.getByText("Comece uma conversa com o seu RAG"),
    ).toBeInTheDocument();
  });

  it("renders chat messages, retrieved context and the streaming placeholder", () => {
    render(
      <ChatMessageList
        messages={[
          {
            id: "user-1",
            role: "user",
            content: "What is pgvector?",
            createdAt: "2026-03-13T12:00:00.000Z",
            status: "idle",
          },
          {
            id: "assistant-1",
            role: "assistant",
            content: "pgvector enables similarity search.",
            createdAt: "2026-03-13T12:01:00.000Z",
            status: "loading",
            context: [
              {
                id: 7,
                content:
                  "pgvector adds vector similarity search to PostgreSQL.",
                metadata: null,
                distance: 0.142,
              },
            ],
          },
        ]}
        isStreaming
      />,
    );

    expect(screen.getByText("What is pgvector?")).toBeInTheDocument();
    expect(
      screen.getByText("pgvector enables similarity search."),
    ).toBeInTheDocument();
    expect(screen.getByText("Retrieved context")).toBeInTheDocument();
    expect(screen.getByText("Chunk #7")).toBeInTheDocument();
    expect(screen.getByText("Generating")).toBeInTheDocument();
    expect(
      screen.getByText("A resposta esta chegando em streaming..."),
    ).toBeInTheDocument();
  });

  it("shows a clear notice when the assistant response has no retrieved context", () => {
    render(
      <ChatMessageList
        messages={[
          {
            id: "assistant-2",
            role: "assistant",
            content:
              "Nao encontrei contexto relevante nos documentos ingeridos.",
            createdAt: "2026-03-13T12:02:00.000Z",
            status: "idle",
            context: [],
          },
        ]}
        isStreaming={false}
      />,
    );

    expect(
      screen.getByText(
        /Nenhum trecho relevante foi recuperado dos documentos/i,
      ),
    ).toBeInTheDocument();
  });
});
