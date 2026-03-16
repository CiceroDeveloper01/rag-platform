import { Injectable } from '@nestjs/common';

export interface AgentTraceEvent {
  traceId: string;
  timestamp: string;
  step:
    | 'agent_trace_started'
    | 'agent_routed'
    | 'rag_retrieval'
    | 'tool_called'
    | 'response_generated'
    | 'evaluation_completed';
  data: Record<string, unknown>;
}

@Injectable()
export class AgentTraceRepository {
  private readonly events: AgentTraceEvent[] = [];

  save(event: AgentTraceEvent): AgentTraceEvent {
    this.events.unshift(event);
    this.events.splice(200);
    return event;
  }

  list(): AgentTraceEvent[] {
    return [...this.events];
  }
}
