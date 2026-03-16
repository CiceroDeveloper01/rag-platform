"use client";

import { getPublicApiBaseUrl } from "@/src/lib/api/api-client";

export interface AgentTraceSocketEvent {
  traceId: string;
  timestamp: string;
  step:
    | "agent_trace_started"
    | "agent_routed"
    | "rag_retrieval"
    | "tool_called"
    | "response_generated"
    | "evaluation_completed";
  data: Record<string, unknown>;
}

function buildSocketUrl() {
  const apiBaseUrl = getPublicApiBaseUrl().replace(/\/$/, "");
  const wsProtocol = apiBaseUrl.startsWith("https://") ? "wss://" : "ws://";

  return `${apiBaseUrl.replace(/^https?:\/\//, wsProtocol)}/ws/agent-trace`;
}

export function connectAgentTraceSocket(handlers: {
  onEvent: (event: AgentTraceSocketEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
}) {
  const socket = new WebSocket(buildSocketUrl());

  socket.addEventListener("open", () => {
    handlers.onOpen?.();
  });

  socket.addEventListener("message", (event) => {
    try {
      handlers.onEvent(JSON.parse(event.data) as AgentTraceSocketEvent);
    } catch {
      // Ignore malformed frames to keep the command center resilient.
    }
  });

  socket.addEventListener("close", () => {
    handlers.onClose?.();
  });

  socket.addEventListener("error", () => {
    handlers.onError?.();
  });

  return socket;
}
