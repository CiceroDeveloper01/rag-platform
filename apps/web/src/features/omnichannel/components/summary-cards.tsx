import { StatusCard } from "@/src/components/ui/status-card";
import type { OmnichannelOverview } from "@/src/types/omnichannel";

function formatPercentage(value: number) {
  return `${Math.round(value)}%`;
}

export function SummaryCards({ overview }: { overview: OmnichannelOverview }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">

      <StatusCard
        title="Requests"
        value={String(overview.totalRequests)}
        tone="info"
        description="Total de requisicoes inbound processadas pelos canais omnichannel."
      />

      <StatusCard
        title="Success"
        value={String(overview.successCount)}
        tone="success"
        description="Execucoes concluídas com sucesso no periodo consultado."
      />

      <StatusCard
        title="Errors"
        value={String(overview.errorCount)}
        tone={overview.errorCount > 0 ? "error" : "neutral"}
        description="Falhas registradas nas execucoes omnichannel."
      />

      <StatusCard
        title="Avg latency"
        value={`${overview.avgLatencyMs} ms`}
        tone="warning"
        description="Latencia media das execucoes orquestradas."
      />

      <StatusCard
        title="P95 latency"
        value={`${overview.p95LatencyMs} ms`}
        tone="warning"
        description="Latencia p95 para acompanhar outliers do fluxo."
      />

      <StatusCard
        title="Knowledge-assisted"
        value={formatPercentage(overview.ragUsagePercentage)}
        tone="info"
        description="Percentual das execucoes que usaram retrieval de conhecimento."
      />

    </section>
  );
}
