import { StatusPill } from "@/src/components/ui/status-pill";
import type { DashboardOverview } from "../types/dashboard.types";

export function DashboardMetricsGrid({
  overview,
}: {
  overview: DashboardOverview;
}) {
  const cards = [
    {
      title: "API status",
      value: overview.health?.status ?? "unknown",
      tone: overview.health?.status === "ok" ? "success" : "warning",
      description: "Leitura atual do endpoint /health.",
    },
    {
      title: "Documents",
      value: String(overview.documents.length),
      tone: overview.hasDocumentsEndpoint ? "info" : "warning",
      description: overview.hasDocumentsEndpoint
        ? "Origem na API."
        : "Origem local ate a API expor listagem.",
    },
    {
      title: "Conversations",
      value: String(overview.conversationsCount),
      tone: "neutral",
      description: "Historico persistido e pronto para backend real.",
    },
    {
      title: "Queries",
      value: overview.queryCount == null ? "n/a" : String(overview.queryCount),
      tone: "neutral",
      description: "Preparado para endpoint ou metrica dedicada.",
    },
  ] as const;

  return (
    <section className="grid gap-5 lg:grid-cols-4">

      {cards.map((card) => (
        <article
          key={card.title}
          className="rounded-[28px] border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
        >

          <div className="flex items-center justify-between gap-4">

            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                            {card.title}

            </div>
                        <StatusPill tone={card.tone}>{card.value}</StatusPill>

          </div>

          <p className="mt-5 text-sm leading-7 text-slate-600">
                        {card.description}

          </p>

        </article>
      ))}

    </section>
  );
}
