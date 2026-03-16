import { SectionCard } from "@/src/components/ui/section-card";
import { StatusPill } from "@/src/components/ui/status-pill";
import { formatDate } from "@rag-platform/utils";
import type { OmnichannelRequestDetails } from "@/src/types/omnichannel";

function timelineFromDetails(details: OmnichannelRequestDetails) {
  const execution = details.execution;

  if (execution?.timeline?.length) {
    return execution.timeline.map((event) => ({
      label: event.eventName
        .split("_")
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join(" "),
      value: formatDate(event.occurredAt, { locale: "pt-BR" }),
      tone:
        event.eventName === "error"
          ? ("error" as const)
          : event.eventName.endsWith("completed") ||
              event.eventName === "response_sent"
            ? ("success" as const)
            : ("info" as const),
    }));
  }

  return [
    {
      label: "Received",
      value: formatDate(details.message.receivedAt, { locale: "pt-BR" }),
      tone: "info" as const,
    },
    {
      label: "Processing",
      value: details.message.processedAt ? "Completed" : "Pending",
      tone: details.message.processedAt
        ? ("success" as const)
        : ("warning" as const),
    },
    {
      label: "RAG Query",
      value: execution?.usedRag
        ? execution.ragQuery || "Context retrieved"
        : "Direct response",
      tone: execution?.usedRag ? ("success" as const) : ("neutral" as const),
    },
    {
      label: "LLM Execution",
      value: execution?.modelName ?? execution?.agentName ?? "n/a",
      tone:
        execution?.status === "FAILED" ? ("error" as const) : ("info" as const),
    },
    {
      label: "Response Dispatch",
      value: details.message.processedAt
        ? formatDate(details.message.processedAt, { locale: "pt-BR" })
        : "Pending",
      tone: details.message.processedAt
        ? ("success" as const)
        : ("warning" as const),
    },
  ];
}

export function RequestDetailsPanel({
  details,
}: {
  details: OmnichannelRequestDetails;
}) {
  const timeline = timelineFromDetails(details);

  return (
    <div className="space-y-6">

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">

        <SectionCard className="space-y-5">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>

              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Message details
              </div>

              <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                                Request #{details.message.id}

              </h2>

            </div>

            <StatusPill
              tone={details.message.status === "FAILED" ? "error" : "info"}
            >
                            {details.message.status}

            </StatusPill>

          </div>

          <div className="grid gap-4 md:grid-cols-2">

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                                Channel
              </div>

              <div className="mt-2 font-medium text-slate-950">
                                {details.message.channel}

              </div>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                                Sender
              </div>

              <div className="mt-2 font-medium text-slate-950">

                {details.message.senderName ??
                  details.message.senderAddress ??
                  "n/a"}

              </div>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                                Received
              </div>

              <div className="mt-2 font-medium text-slate-950">

                {formatDate(details.message.receivedAt, { locale: "pt-BR" })}

              </div>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                                Processed
              </div>

              <div className="mt-2 font-medium text-slate-950">

                {formatDate(details.message.processedAt, { locale: "pt-BR" })}

              </div>

            </div>

          </div>

          {details.message.subject ? (
            <div className="space-y-2">

              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                Subject
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
                                {details.message.subject}

              </div>

            </div>
          ) : null}

          <div className="space-y-2">

            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                            Body
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                            {details.message.body}

            </div>

          </div>

          <div className="space-y-2">

            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                            Normalized text
            </div>

            <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 px-4 py-4 text-sm text-slate-100">
                            {details.message.normalizedText}

            </pre>

          </div>

          <div className="space-y-2">

            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                            Metadata
            </div>

            <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 px-4 py-4 text-sm text-slate-100">

              {JSON.stringify(details.message.metadata ?? {}, null, 2)}

            </pre>

          </div>

        </SectionCard>

        <SectionCard className="space-y-5">

          <div>

            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Execution details
            </div>

            <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                            Agent execution
            </h2>

          </div>

          {details.execution ? (
            <div className="grid gap-3 text-sm text-slate-600">

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

                <span className="font-medium text-slate-950">Agent:</span>
                                {details.execution.agentName ?? "n/a"}

              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

                <span className="font-medium text-slate-950">Model:</span>
                                {details.execution.modelName ?? "n/a"}

              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

                <span className="font-medium text-slate-950">RAG:</span>

                {details.execution.usedRag ? "Enabled" : "Direct"}

              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

                <span className="font-medium text-slate-950">Latency:</span>

                {details.execution.latencyMs
                  ? `${details.execution.latencyMs} ms`
                  : "n/a"}

              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

                <span className="font-medium text-slate-950">
                                    Input tokens:
                </span>
                                {details.execution.inputTokens ?? "n/a"}

              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

                <span className="font-medium text-slate-950">
                                    Output tokens:
                </span>
                                {details.execution.outputTokens ?? "n/a"}

              </div>

              {details.execution.ragQuery ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

                  <span className="font-medium text-slate-950">RAG query:</span>
                                    {details.execution.ragQuery}

                </div>
              ) : null}

              {details.execution.errorMessage ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">

                  <span className="font-medium text-rose-950">Error:</span>
                                    {details.execution.errorMessage}

                </div>
              ) : null}

            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-600">
                            Nenhuma execucao associada foi encontrada para esta request.

            </div>
          )}

        </SectionCard>

      </section>

      <SectionCard className="space-y-5">

        <div>

          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Execution timeline
          </div>

          <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                        Linha do tempo da execucao
          </h2>

        </div>

        <div className="grid gap-4 xl:grid-cols-5">

          {timeline.map((item) => (
            <div
              key={item.label}
              className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"
            >

              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                {item.label}

              </div>

              <div className="mt-3">

                <StatusPill tone={item.tone}>{item.value}</StatusPill>

              </div>

            </div>
          ))}

        </div>

      </SectionCard>

    </div>
  );
}
