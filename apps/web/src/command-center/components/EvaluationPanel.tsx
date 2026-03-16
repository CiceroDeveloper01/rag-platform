"use client";

import type { AgentTraceSocketEvent } from "@/src/services/agent-trace.socket";

export function EvaluationPanel({ event }: { event?: AgentTraceSocketEvent }) {
  const rows: Array<{ label: string; value?: number }> = [
    { label: "Relevance", value: asNumber(event?.data.relevanceScore) },
    { label: "Coherence", value: asNumber(event?.data.coherenceScore) },
    { label: "Safety", value: asNumber(event?.data.safetyScore) },
    {
      label: "Average quality",
      value: asNumber(event?.data.averageQualityScore),
    },
    { label: "Failure rate", value: asNumber(event?.data.failureRate) },
  ];

  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white/80 p-5">
            <h3 className="text-lg font-semibold text-slate-950">Evaluation</h3>

      <div className="mt-4 space-y-3">

        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3"
          >
                        <span className="text-sm text-slate-600">{label}</span>

            <span className="text-sm font-semibold text-slate-950">

              {typeof value === "number" ? value.toFixed(2) : "--"}

            </span>

          </div>
        ))}

      </div>

    </section>
  );
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}
