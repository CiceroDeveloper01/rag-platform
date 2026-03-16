import type { DateTimeValue, ExecutionEventName } from "@rag-platform/types";

export type ExecutionStreamEventType = ExecutionEventName | "execution_started";

export interface ExecutionStreamEventResponse {
  executionId: number;
  type: ExecutionStreamEventType;
  message: string;
  color: string;
  icon?: string;
  severity?: "info" | "success" | "warning" | "error";
  channel?: string;
  timestamp: DateTimeValue;
  eventType?: ExecutionStreamEventType;
  metadata?: Record<string, unknown> | null;
}
