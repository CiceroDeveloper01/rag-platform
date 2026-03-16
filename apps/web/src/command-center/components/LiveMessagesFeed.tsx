"use client";

import type { AgentTraceSocketEvent } from "@/src/services/agent-trace.socket";

export function LiveMessagesFeed({
  events,
}: {
  events: AgentTraceSocketEvent[];
}) {
  const received = events.filter(
    (event) => event.step === "agent_trace_started",
  );

  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white/80 p-5">

      <h3 className="text-lg font-semibold text-slate-950">Live messages</h3>

      <div className="mt-4 space-y-3">

        {received.length === 0 ? (
          <p className="text-sm text-slate-500">No live messages yet.</p>
        ) : (
          received.slice(0, 8).map((event) => (
            <article
              key={`${event.traceId}-${event.timestamp}`}
              className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4"
            >

              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
                                {String(event.data.channel ?? "unknown")}

              </p>

              <p className="mt-2 text-sm text-slate-700">
                                {String(event.data.body ?? "")}

              </p>

              <p className="mt-2 text-xs text-slate-500">{event.timestamp}</p>

            </article>
          ))
        )}

      </div>

    </section>
  );
}
