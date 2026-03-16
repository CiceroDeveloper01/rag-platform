"use client";

import type { AgentTraceSocketEvent } from "@/src/services/agent-trace.socket";

export function ReasoningPanel({ event }: { event?: AgentTraceSocketEvent }) {
  const reasoning =
    typeof event?.data.reasoning === "string"
      ? event.data.reasoning
      : "No reasoning available yet.";

  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white/80 p-5">
            <h3 className="text-lg font-semibold text-slate-950">Reasoning</h3>
            <p className="mt-4 text-sm leading-7 text-slate-700">{reasoning}</p>

    </section>
  );
}
