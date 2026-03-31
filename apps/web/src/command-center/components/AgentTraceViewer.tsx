"use client";

import type { AgentTraceSocketEvent } from "@/src/services/agent-trace.socket";

const labels: Record<AgentTraceSocketEvent["step"], string> = {
  agent_trace_started: "Message received",
  agent_routed: "Agent routed",
  rag_retrieval: "Knowledge retrieval",
  tool_called: "Tool called",
  response_generated: "Response generated",
  evaluation_completed: "Evaluation completed",
};

export function AgentTraceViewer({
  events,
}: {
  events: AgentTraceSocketEvent[];
}) {
  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white/80 p-5">

      <h3 className="text-lg font-semibold text-slate-950">Agent timeline</h3>

      <div className="mt-4 space-y-3">

        {events.length === 0 ? (
          <p className="text-sm text-slate-500">No trace events yet.</p>
        ) : (
          events.slice(0, 16).map((event) => (
            <div
              key={`${event.traceId}-${event.step}-${event.timestamp}`}
              className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4"
            >

              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />

              <div>

                <p className="text-sm font-semibold text-slate-900">
                                    {labels[event.step]}

                </p>

                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                                    {event.traceId}

                </p>

                <p className="mt-1 text-xs text-slate-500">{event.timestamp}</p>

              </div>

            </div>
          ))
        )}

      </div>

    </section>
  );
}
