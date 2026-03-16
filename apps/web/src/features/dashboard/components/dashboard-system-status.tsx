import { SectionCard } from "@/src/components/ui/section-card";
import type { DashboardOverview } from "../types/dashboard.types";

export function DashboardSystemStatus({
  overview,
}: {
  overview: DashboardOverview;
}) {
  return (
    <SectionCard className="space-y-4">

      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                System status
      </div>

      <div className="grid gap-3 text-sm text-slate-600">

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="font-medium text-slate-900">API:</span>
                    {overview.health?.status ?? "unknown"}

        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

          <span className="font-medium text-slate-900">Database:</span>
                    {overview.health?.database ?? "unknown"}

        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="font-medium text-slate-900">Version:</span>
                    {overview.health?.version ?? "n/a"}

        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="font-medium text-slate-900">Updated:</span>

          {overview.health
            ? new Date(overview.health.timestamp).toLocaleString("pt-BR")
            : "n/a"}

        </div>

      </div>

    </SectionCard>
  );
}
