import { render, screen } from "@testing-library/react";
import { AgentTraceViewer } from "./AgentTraceViewer";
import { EvaluationPanel } from "./EvaluationPanel";
import { LiveMessagesFeed } from "./LiveMessagesFeed";
import { ReasoningPanel } from "./ReasoningPanel";
import { ToolExecutionPanel } from "./ToolExecutionPanel";

const baseEvent = {
  traceId: "telegram:1",
  timestamp: "2026-03-15T12:00:00.000Z",
  step: "agent_trace_started" as const,
  data: {
    channel: "telegram",
    body: "hello",
  },
};

describe("command center components", () => {
  it("renders trace and live message items", () => {
    render(
      <>

        <AgentTraceViewer events={[baseEvent]} />

        <LiveMessagesFeed events={[baseEvent]} />

      </>,
    );

    expect(screen.getByText("Message received")).toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("renders empty states when there are no events", () => {
    render(
      <>

        <AgentTraceViewer events={[]} />

        <LiveMessagesFeed events={[]} />

      </>,
    );

    expect(screen.getByText("No trace events yet.")).toBeInTheDocument();
    expect(screen.getByText("No live messages yet.")).toBeInTheDocument();
  });

  it("renders evaluation, reasoning and tool details", () => {
    render(
      <>

        <EvaluationPanel
          event={{
            ...baseEvent,
            step: "evaluation_completed",
            data: {
              relevanceScore: 0.91,
              coherenceScore: 0.93,
              safetyScore: 0.99,
              averageQualityScore: 0.94,
              failureRate: 0.01,
            },
          }}
        />

        <ReasoningPanel
          event={{
            ...baseEvent,
            step: "agent_routed",
            data: {
              reasoning: "The system found the best route.",
            },
          }}
        />

        <ToolExecutionPanel
          event={{
            ...baseEvent,
            step: "tool_called",
            data: {
              tool: "execute.reply-conversation",
              payloadSummary: {
                channel: "telegram",
              },
            },
          }}
        />

      </>,
    );

    expect(screen.getByText("0.91")).toBeInTheDocument();
    expect(
      screen.getByText("The system found the best route."),
    ).toBeInTheDocument();
    expect(screen.getByText("execute.reply-conversation")).toBeInTheDocument();
    expect(screen.getByText(/telegram/)).toBeInTheDocument();
  });

  it("renders fallback content when optional data is missing", () => {
    render(
      <>

        <EvaluationPanel />

        <ReasoningPanel />

        <ToolExecutionPanel />

      </>,
    );

    expect(screen.getAllByText("--").length).toBeGreaterThan(0);
    expect(screen.getByText("No reasoning available yet.")).toBeInTheDocument();
    expect(screen.getByText("No tool executed yet")).toBeInTheDocument();
  });
});
