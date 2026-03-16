"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SectionCard } from "@/src/components/ui/section-card";

export function ErrorRateWidget({
  successCount,
  errorCount,
}: {
  successCount: number;
  errorCount: number;
}) {
  const chartData = [
    { name: "Success", value: successCount },
    { name: "Errors", value: errorCount },
  ];
  const total = successCount + errorCount;
  const errorRate = total > 0 ? Math.round((errorCount / total) * 100) : 0;

  return (
    <SectionCard className="space-y-5">

      <div>

        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Error rate
        </div>

        <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                    Taxa de erro
        </h2>

        <p className="mt-2 text-sm leading-7 text-slate-600">
                    {errorRate}
          % das execucoes terminaram com falha no periodo atual.
        </p>

      </div>

      <div className="h-[240px]">

        <ResponsiveContainer width="100%" height="100%">

          <PieChart>

            <Pie
              data={chartData}
              dataKey="value"
              innerRadius={56}
              outerRadius={90}
              paddingAngle={4}
            >

              <Cell fill="#0f766e" />

              <Cell fill="#e11d48" />

            </Pie>

            <Tooltip />

          </PieChart>

        </ResponsiveContainer>

      </div>

      <div className="grid gap-3 text-sm text-slate-600">

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="font-medium text-slate-900">Success:</span>
                    {successCount}

        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="font-medium text-slate-900">Errors:</span>
                    {errorCount}

        </div>

      </div>

    </SectionCard>
  );
}
