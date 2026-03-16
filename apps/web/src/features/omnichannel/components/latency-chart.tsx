"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionCard } from "@/src/components/ui/section-card";
import type { LatencyMetrics } from "@/src/types/omnichannel";

export function LatencyChart({ data }: { data: LatencyMetrics[] }) {
  return (
    <SectionCard className="space-y-5">

      <div>

        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Latency metrics
        </div>

        <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                    Latencia media e p95 por canal
        </h2>

      </div>

      <div className="h-[320px]" aria-label="Grafico de latencia por canal">

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
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(148,163,184,0.22)",
              }}
            />

            <Legend />

            <Bar
              dataKey="avgLatencyMs"
              name="Average"
              fill="#0f766e"
              radius={[10, 10, 6, 6]}
            />

            <Bar
              dataKey="p95LatencyMs"
              name="P95"
              fill="#f59e0b"
              radius={[10, 10, 6, 6]}
            />

          </BarChart>

        </ResponsiveContainer>

      </div>

    </SectionCard>
  );
}
