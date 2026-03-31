export type ConversationChannel = "WEB" | "WHATSAPP" | "TELEGRAM";

export type ConversationFlowType =
  | "tool-only"
  | "knowledge-assisted"
  | "handoff"
  | "sensitive-operation";

export interface ConversationSummaryItem {
  id: string;
  sessionId: string;
  channel: ConversationChannel;
  customerName: string;
  tenantId: string;
  status: string;
  domainContext: string;
  flowType: ConversationFlowType;
  lastMessage: string;
  lastActivityAt: string;
  source: "api" | "mock";
}

export interface ConversationTimelineItem {
  id: string;
  role: "customer" | "platform" | "system";
  content: string;
  timestamp: string;
}

export interface ConversationDetail {
  summary: ConversationSummaryItem;
  timeline: ConversationTimelineItem[];
  intent?: string;
  specialist?: string;
  tools: string[];
  handoffRequested: boolean;
  pendingConfirmation: boolean;
  correlationId: string;
  latencyMs?: number;
  metadataSource: "backend" | "mock";
}

export interface ConversationWorkspace {
  conversations: ConversationSummaryItem[];
  highlighted: {
    total: number;
    byChannel: Record<ConversationChannel, number>;
    handoffs: number;
    toolOnlyRate: number;
  };
  source: "api" | "mock";
}

export interface HandoffItem {
  id: string;
  channel: ConversationChannel;
  customerName: string;
  queue: string;
  reason: string;
  requestedAt: string;
  status: "requested" | "processing" | "completed";
  source: "api" | "mock";
}

export interface SimulatorTelemetry {
  intent: string;
  specialist: string;
  flowType: ConversationFlowType;
  tools: string[];
  handoffRequested: boolean;
  pendingConfirmation: boolean;
  latencyMs: number;
  correlationId: string;
  metadataSource: "simulated";
}

export interface SimulatorSession {
  id: string;
  title: string;
  channel: ConversationChannel;
  context: "cards" | "credit" | "investments" | "customer" | "dashboard";
  status: "idle" | "running" | "handoff" | "attention";
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: string;
  }>;
  telemetry: SimulatorTelemetry | null;
}
