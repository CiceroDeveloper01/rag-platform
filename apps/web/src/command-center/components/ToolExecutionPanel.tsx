"use client";

import type { AgentTraceSocketEvent } from "@/src/services/agent-trace.socket";

export function ToolExecutionPanel({
  event,
}: {
  event?: AgentTraceSocketEvent;
}) {
  const toolName = String(event?.data.tool ?? "No tool executed yet");

  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white/80 p-5">

      <h3 className="text-lg font-semibold text-slate-950">Tool execution</h3>
            <p className="mt-4 text-sm text-slate-700">{toolName}</p>

      {event?.data.payloadSummary ? (
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                    {JSON.stringify(event.data.payloadSummary, null, 2)}

        </pre>
      ) : null}

    </section>
  );
}
