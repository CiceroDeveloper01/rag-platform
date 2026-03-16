"use client";

import { getPublicApiBaseUrl } from "@/src/lib/api/api-client";

export interface AnalyticsSocketEvent {
  eventType:
    | "message_received"
    | "agent_selected"
    | "flow_executed"
    | "agent_quality"
    | "user_feedback"
    | "ai_cost"
    | "tenant_usage";
  timestamp: string;
  channel?: string;
  language?: string;
  agent?: string;
  flow?: string;
  keywords?: string[];
  averageQualityScore?: number;
  failureRate?: number;
  userSatisfaction?: number;
  averageRating?: number;
  totalCost?: number;
  tenantId?: string;
}

function buildSocketUrl(tenantId?: string) {
  const apiBaseUrl = getPublicApiBaseUrl().replace(/\/$/, "");
  const wsProtocol = apiBaseUrl.startsWith("https://") ? "wss://" : "ws://";
  const url = new URL(
    `${apiBaseUrl.replace(/^https?:\/\//, wsProtocol)}/ws/analytics`,
  );

  if (tenantId) {
    url.searchParams.set("tenantId", tenantId);
  }

  return url.toString();
}

export function connectAnalyticsSocket(handlers: {
  onEvent: (event: AnalyticsSocketEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
  tenantId?: string;
}) {
  const socket = new WebSocket(buildSocketUrl(handlers.tenantId));

  socket.addEventListener("open", () => {
    handlers.onOpen?.();
  });

  socket.addEventListener("message", (event) => {
    try {
      handlers.onEvent(JSON.parse(event.data) as AnalyticsSocketEvent);
    } catch {
      // Ignore malformed frames to keep the dashboard resilient.
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
