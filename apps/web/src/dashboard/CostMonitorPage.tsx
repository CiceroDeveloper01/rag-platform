"use client";

import { useEffect, useState } from "react";
import { CostPerAgentChart } from "@/src/components/analytics/CostPerAgentChart";
import { CostPerTenantChart } from "@/src/components/analytics/CostPerTenantChart";
import { ErrorState } from "@/src/components/states/error-state";
import { LoadingPanel } from "@/src/components/states/loading-panel";
import { EmptyState } from "@/src/components/ui/empty-state";
import { analyticsApiService } from "@/src/services/analytics-api.service";

export function CostMonitorPage() {
  const [costByAgent, setCostByAgent] = useState<
    Array<{ agentName: string; cost: number }>
  >([]);
  const [costByTenant, setCostByTenant] = useState<
    Array<{ tenantId: string; cost: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadSeed, setReloadSeed] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const [aiCost, tenantUsage] = await Promise.all([
          analyticsApiService.getAiCost(),
          analyticsApiService.getTenantUsage(),
        ]);

        if (!isMounted) {
          return;
        }

        setCostByAgent(
          Array.isArray(aiCost.costByAgent) ? aiCost.costByAgent : [],
        );
        setCostByTenant(
          Array.isArray(tenantUsage.costByTenant)
            ? tenantUsage.costByTenant
            : [],
        );
      } catch {
        if (!isMounted) {
          return;
        }

        setError("Nao foi possivel carregar os custos da IA no momento.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [reloadSeed]);

  function renderContent() {
    if (isLoading) {
      return (
        <LoadingPanel
          title="Carregando custos"
          description="Buscando consumo por agente e por tenant para montar o painel."
        />
      );
    }

    if (error) {
      return (
        <ErrorState
          title="Nao foi possivel carregar o monitor de custo"
          description={error}
          action={
            <button
              type="button"
              onClick={() => setReloadSeed((current) => current + 1)}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
                            Tentar novamente
            </button>
          }
        />
      );
    }

    if (costByAgent.length === 0 && costByTenant.length === 0) {
      return (
        <EmptyState
          title="Ainda nao ha dados suficientes para custo"
          description="Assim que o orchestrator registrar uso de tokens e custo por tenant, este painel sera preenchido."
        />
      );
    }

    return (
      <div className="grid gap-6 xl:grid-cols-2">

        <CostPerAgentChart data={costByAgent} />

        <CostPerTenantChart data={costByTenant} />

      </div>
    );
  }

  return (
    <div className="space-y-8">

      <section className="rounded-[32px] border border-slate-200/80 bg-white/80 p-6 shadow-[0_36px_120px_-72px_rgba(15,23,42,0.45)] backdrop-blur">

        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-rose-600">
                    Cost monitoring
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
                    AI cost monitor
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-slate-600">
                    Compare custo por agente e por tenant para acompanhar consumo de
                    tokens e impacto operacional.
        </p>

      </section>
            {renderContent()}

    </div>
  );
}
