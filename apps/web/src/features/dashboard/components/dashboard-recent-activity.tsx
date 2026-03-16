import { SectionCard } from "@/src/components/ui/section-card";
import type { DashboardOverview } from "../types/dashboard.types";

export function DashboardRecentActivity({
  overview,
}: {
  overview: DashboardOverview;
}) {
  return (
    <SectionCard className="space-y-4">

      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Recent activity
      </div>

      {overview.recentActivity.length > 0 ? (
        <div className="grid gap-3">

          {overview.recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >

              <div className="font-medium text-slate-950">{activity.title}</div>

              <div className="mt-1 text-sm text-slate-500">
                                {activity.subtitle}

              </div>

            </div>
          ))}

        </div>
      ) : (
        <p className="text-sm leading-7 text-slate-600">
                    Sem atividade recente ainda. Assim que documentos e conversas
                    surgirem, este bloco passa a refletir o uso da plataforma.

        </p>
      )}

    </SectionCard>
  );
}
