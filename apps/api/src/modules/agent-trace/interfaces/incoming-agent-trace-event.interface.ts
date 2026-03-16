import type { AgentTraceEvent } from '../agent-trace.repository';

export interface IncomingAgentTraceEvent {
  traceId: string;
  timestamp: string;
  step: AgentTraceEvent['step'];
  data?: Record<string, unknown>;
}
