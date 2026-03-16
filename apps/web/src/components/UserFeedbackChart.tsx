"use client";

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";

export interface UserFeedbackDatum {
  name: string;
  value: number;
}

const COLORS = ["#16a34a", "#f97316"];

export function UserFeedbackChart({ data }: { data: UserFeedbackDatum[] }) {
  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">

      <div className="mb-4">

        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-600">
                    Feedback
        </p>

        <h3 className="text-xl font-semibold text-slate-950">
                    Satisfacao do usuario
        </h3>

      </div>

      <div className="h-72">

        <ResponsiveContainer width="100%" height="100%">

          <PieChart>

            <Pie data={data} dataKey="value" nameKey="name" outerRadius={96}>

              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}

            </Pie>

            <Tooltip />

          </PieChart>

        </ResponsiveContainer>

      </div>

    </section>
  );
}
