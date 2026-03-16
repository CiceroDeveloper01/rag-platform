"use client";

import { useCallback, useEffect, useState } from "react";
import { ErrorState } from "@/src/components/states/error-state";
import { LoadingPanel } from "@/src/components/states/loading-panel";
import { SectionCard } from "@/src/components/ui/section-card";
import { StatusCard } from "@/src/components/ui/status-card";
import { observabilityApiService } from "../services/observability-api.service";
import type { HealthResponse } from "../types/observability.types";
import { HealthStatusCard } from "./health-status-card";
import { RefreshStatusButton } from "./refresh-status-button";
import { ServiceLinkCard } from "./service-link-card";

export function ObservabilityOverview() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadHealth = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "refresh") {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await observabilityApiService.getHealth();
      setHealth(response);
      setError(null);
    } catch (requestError) {
      console.error("[observability] health request failed", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel consultar o health check.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth("initial");
  }, [loadHealth]);

  const links = observabilityApiService.getLinks();

  if (isLoading) {
    return (
      <LoadingPanel
        title="Consultando API"
        description="Buscando health check e disponibilidade dos links operacionais."
      />
    );
  }

  return (
    <div className="space-y-6">

      <section className="grid gap-5 lg:grid-cols-3">

        <HealthStatusCard health={health} error={error} />

        <StatusCard
          title="Prometheus"
          value="ready"
          tone="info"
          description="Coleta metricas expostas pelo backend via /metrics."
        />

        <StatusCard
          title="Grafana"
          value="ready"
          tone="info"
          description="Painel para acompanhar dashboards e observabilidade local."
        />

      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">

        <SectionCard className="space-y-4">

          <div className="flex items-center justify-between gap-4">

            <div>

              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Backend status
              </div>

              <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                                Sinais essenciais do ambiente
              </h2>

            </div>

            <RefreshStatusButton
              onClick={() => void loadHealth("refresh")}
              disabled={isRefreshing}
            />

          </div>

          {error && !health ? <ErrorState description={error} /> : null}

          {health ? (
            <div className="grid gap-3 text-sm text-slate-600">

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

                <span className="font-medium text-slate-900">Status:</span>
                                {health.status}

              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

                <span className="font-medium text-slate-900">Database:</span>
                                {health.database}

              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

                <span className="font-medium text-slate-900">Timestamp:</span>

                {new Date(health.timestamp).toLocaleString("pt-BR")}

              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

                <span className="font-medium text-slate-900">Version:</span>
                                {health.version}

              </div>

            </div>
          ) : null}

        </SectionCard>

        <div className="grid gap-4 md:grid-cols-2">

          <ServiceLinkCard
            title="API Health"
            href={links.apiHealth}
            description="Abrir o endpoint de health da API."
          />

          <ServiceLinkCard
            title="API Metrics"
            href={links.apiMetrics}
            description="Consultar o endpoint /metrics da API."
          />

          <ServiceLinkCard
            title="Prometheus"
            href={links.prometheus}
            description="Acompanhar targets e scraping do ambiente."
          />

          <ServiceLinkCard
            title="Grafana"
            href={links.grafana}
            description="Abrir dashboards locais de observabilidade."
          />

        </div>

      </section>

    </div>
  );
}
