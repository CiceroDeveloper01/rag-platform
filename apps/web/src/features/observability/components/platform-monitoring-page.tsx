"use client";

import { useEffect, useState } from "react";
import { CostPerAgentChart } from "@/src/components/analytics/CostPerAgentChart";
import { CostPerTenantChart } from "@/src/components/analytics/CostPerTenantChart";
import { PageHeader } from "@/src/components/ui/page-header";
import { SectionCard } from "@/src/components/ui/section-card";
import { StatusCard } from "@/src/components/ui/status-card";
import { analyticsApiService } from "@/src/services/analytics-api.service";
import { useOmnichannelOverview } from "@/src/features/omnichannel/hooks/use-omnichannel-overview";
import { ObservabilityOverview } from "./observability-overview";

export function PlatformMonitoringPage() {
  const { data } = useOmnichannelOverview(undefined, {
    refreshIntervalMs: 20_000,
  });
  const [costByAgent, setCostByAgent] = useState<
    Array<{ agentName: string; cost: number }>
  >([]);
  const [costByTenant, setCostByTenant] = useState<
    Array<{ tenantId: string; cost: number }>
  >([]);

  useEffect(() => {
    let isMounted = true;

    async function loadCosts() {
      try {
        const [aiCost, tenantUsage] = await Promise.all([
          analyticsApiService.getAiCost(),
          analyticsApiService.getTenantUsage(),
        ]);

        if (!isMounted) {
          return;
        }

        setCostByAgent(aiCost.costByAgent ?? []);
        setCostByTenant(tenantUsage.costByTenant ?? []);
      } catch {
        if (!isMounted) {
          return;
        }

        setCostByAgent([
          { agentName: "account-manager", cost: 18.42 },
          { agentName: "faq-specialist", cost: 7.2 },
        ]);
        setCostByTenant([
          { tenantId: "banking-demo", cost: 21.13 },
          { tenantId: "ops-lab", cost: 4.49 },
        ]);
      }
    }

    void loadCosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const toolOnlyRate = data ? 100 - data.ragUsage.ragUsagePercentage : 68;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Platform monitoring"
        title="Monitorias e operacao como parte do produto"
        description="A plataforma mostra saude, latencia, throughput e consumo de IA de forma integrada, reforcando uma arquitetura observability-first."
      />

      <section className="grid gap-5 xl:grid-cols-4">
        <StatusCard
          title="Throughput 24h"
          value={String(data?.overview.totalRequests ?? 1248)}
          tone="info"
          description="Requisicoes processadas na camada omnichannel."
        />
        <StatusCard
          title="p95 latency"
          value={`${data?.overview.p95LatencyMs ?? 186} ms`}
          tone="warning"
          description="Latencia de referencia para a jornada monitorada."
        />
        <StatusCard
          title="Tool-only"
          value={`${toolOnlyRate.toFixed(0)}%`}
          tone="success"
          description="Share de execucoes deterministicas na plataforma."
        />
        <StatusCard
          title="Errors"
          value={String(data?.overview.errorCount ?? 12)}
          tone="error"
          description="Falhas observadas no recorte operacional atual."
        />
      </section>

      <ObservabilityOverview />

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard className="space-y-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Custos
            </div>
            <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
              Consumo por agente
            </h2>
          </div>
          <CostPerAgentChart data={costByAgent} />
        </SectionCard>

        <SectionCard className="space-y-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Multi-tenant
            </div>
            <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
              Consumo por tenant
            </h2>
          </div>
          <CostPerTenantChart data={costByTenant} />
        </SectionCard>
      </section>
    </div>
  );
}
