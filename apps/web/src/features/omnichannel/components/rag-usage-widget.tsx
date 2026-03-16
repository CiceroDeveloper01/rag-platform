"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SectionCard } from "@/src/components/ui/section-card";
import type { RagUsageMetrics } from "@/src/types/omnichannel";

const COLORS = ["#0284c7", "#cbd5e1"];

export function RagUsageWidget({ data }: { data: RagUsageMetrics }) {
  const chartData = [
    { name: "RAG", value: data.ragExecutions },
    {
      name: "Direct",
      value: Math.max(data.totalExecutions - data.ragExecutions, 0),
    },
  ];

  return (
    <SectionCard className="space-y-5">

      <div>

        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    RAG adoption
        </div>

        <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                    Uso do RAG
        </h2>

        <p className="mt-2 text-sm leading-7 text-slate-600">
                    {Math.round(data.ragUsagePercentage)}
          % das execucoes usaram contexto           recuperado.
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

              {chartData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}

            </Pie>

            <Tooltip />

          </PieChart>

        </ResponsiveContainer>

      </div>

      <div className="grid gap-3 text-sm text-slate-600">

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="font-medium text-slate-900">Total:</span>
                    {data.totalExecutions}

        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="font-medium text-slate-900">Com RAG:</span>
                    {data.ragExecutions}

        </div>

      </div>

    </SectionCard>
  );
}
