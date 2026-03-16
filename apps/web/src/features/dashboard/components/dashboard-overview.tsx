"use client";

import { useEffect, useState } from "react";
import { ErrorState } from "@/src/components/states/error-state";
import { LoadingPanel } from "@/src/components/states/loading-panel";
import { dashboardApiService } from "../services/dashboard-api.service";
import type { DashboardOverview as DashboardOverviewModel } from "../types/dashboard.types";
import { DashboardHero } from "./dashboard-hero";
import { DashboardMetricsGrid } from "./dashboard-metrics-grid";
import { DashboardQuickActions } from "./dashboard-quick-actions";
import { DashboardRecentActivity } from "./dashboard-recent-activity";
import { DashboardSystemStatus } from "./dashboard-system-status";

export function DashboardOverview() {
  const [overview, setOverview] = useState<DashboardOverviewModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadOverview() {
      try {
        const response = await dashboardApiService.getOverview();

        if (isMounted) {
          setOverview(response);
        }
      } catch (requestError) {
        console.error("[dashboard] overview request failed", requestError);

        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Nao foi possivel carregar o dashboard.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">

        <DashboardHero />

        <LoadingPanel
          title="Carregando dashboard"
          description="Consolidando status da API, documentos ingeridos, historico de conversas e links operacionais."
        />

      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="space-y-8">

        <DashboardHero />

        <ErrorState
          description={error ?? "Nao foi possivel carregar o dashboard."}
        />

      </div>
    );
  }

  return (
    <div className="space-y-8">

      <DashboardHero />

      <DashboardMetricsGrid overview={overview} />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">

        <DashboardSystemStatus overview={overview} />

        <DashboardQuickActions />

      </section>

      <DashboardRecentActivity overview={overview} />

    </div>
  );
}
