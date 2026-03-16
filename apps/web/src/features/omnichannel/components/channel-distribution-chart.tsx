"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionCard } from "@/src/components/ui/section-card";
import type { ChannelMetrics } from "@/src/types/omnichannel";

export function ChannelDistributionChart({ data }: { data: ChannelMetrics[] }) {
  return (
    <SectionCard className="space-y-5">

      <div>

        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Channel distribution
        </div>

        <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                    Requisicoes por canal
        </h2>

      </div>

      <div className="h-[320px]" aria-label="Grafico de distribuicao por canal">

        <ResponsiveContainer width="100%" height="100%">

          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 8 }}
          >

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148,163,184,0.18)"
            />

            <XAxis dataKey="channel" tickLine={false} axisLine={false} />

            <YAxis tickLine={false} axisLine={false} />

            <Tooltip
              cursor={{ fill: "rgba(14, 165, 233, 0.08)" }}
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(148,163,184,0.22)",
                boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
              }}
            />

            <Bar
              dataKey="totalRequests"
              name="Requests"
              fill="#0284c7"
              radius={[12, 12, 6, 6]}
            />

          </BarChart>

        </ResponsiveContainer>

      </div>

    </SectionCard>
  );
}
