"use client";

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";

export interface FlowExecutionPoint {
  flow: string;
  total: number;
}

const COLORS = ["#0f766e", "#2563eb", "#dc2626", "#7c3aed", "#0891b2"];

export function FlowExecutionChart({ data }: { data: FlowExecutionPoint[] }) {
  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">

      <div className="mb-4">

        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">
                    Fluxos
        </p>

        <h3 className="text-xl font-semibold text-slate-950">
                    Fluxos executados
        </h3>

      </div>

      <div className="h-72">

        <ResponsiveContainer width="100%" height="100%">

          <PieChart>

            <Pie data={data} dataKey="total" nameKey="flow" outerRadius={96}>

              {data.map((entry, index) => (
                <Cell key={entry.flow} fill={COLORS[index % COLORS.length]} />
              ))}

            </Pie>

            <Tooltip />

          </PieChart>

        </ResponsiveContainer>

      </div>

    </section>
  );
}
