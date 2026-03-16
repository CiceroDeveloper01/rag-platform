import { render, screen, waitFor } from "@testing-library/react";
import { CommandCenterPage } from "./CommandCenterPage";
import { connectAgentTraceSocket } from "@/src/services/agent-trace.socket";

vi.mock("@/src/services/agent-trace.socket", () => ({
  connectAgentTraceSocket: vi.fn(),
}));

describe("CommandCenterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an empty state when the socket is live but there are no traces yet", async () => {
    vi.mocked(connectAgentTraceSocket).mockImplementation((handlers) => {
      handlers.onOpen?.();

      return {
        close: vi.fn(),
      } as unknown as WebSocket;
    });

    render(<CommandCenterPage />);

    await waitFor(() =>
      expect(
        screen.getByText("Ainda nao ha traces suficientes para exibir"),
      ).toBeInTheDocument(),
    );
  });

  it("shows an error state when the socket disconnects before any event arrives", async () => {
    vi.mocked(connectAgentTraceSocket).mockImplementation((handlers) => {
      handlers.onError?.();

      return {
        close: vi.fn(),
      } as unknown as WebSocket;
    });

    render(<CommandCenterPage />);

    await waitFor(() =>
      expect(
        screen.getByText("Nao foi possivel conectar ao command center"),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Tentar novamente")).toBeInTheDocument();
  });

  it("renders the live trace panels when events are received", async () => {
    vi.mocked(connectAgentTraceSocket).mockImplementation((handlers) => {
      handlers.onOpen?.();
      handlers.onEvent({
        traceId: "telegram:1",
        timestamp: "2026-03-15T12:00:00.000Z",
        step: "agent_trace_started",
        data: {
          channel: "telegram",
          body: "hello",
        },
      });
      handlers.onEvent({
        traceId: "telegram:1",
        timestamp: "2026-03-15T12:00:01.000Z",
        step: "agent_routed",
        data: {
          reasoning: "The supervisor selected the conversation agent.",
        },
      });
      handlers.onEvent({
        traceId: "telegram:1",
        timestamp: "2026-03-15T12:00:02.000Z",
        step: "tool_called",
        data: {
          tool: "execute.reply-conversation",
          payloadSummary: {
            channel: "telegram",
          },
        },
      });

      return {
        close: vi.fn(),
      } as unknown as WebSocket;
    });

    render(<CommandCenterPage />);

    await waitFor(() =>
      expect(screen.getByText("Agent timeline")).toBeInTheDocument(),
    );
    expect(screen.getByText("Live messages")).toBeInTheDocument();
    expect(
      screen.getByText("The supervisor selected the conversation agent."),
    ).toBeInTheDocument();
    expect(screen.getByText("execute.reply-conversation")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });
});
