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

export interface ChannelTrafficPoint {
  channel: string;
  total: number;
}

export function ChannelTrafficChart({ data }: { data: ChannelTrafficPoint[] }) {
  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">

      <div className="mb-4">

        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600">
                    Canais
        </p>

        <h3 className="text-xl font-semibold text-slate-950">
                    Trafego por canal
        </h3>

      </div>

      <div className="h-72">

        <ResponsiveContainer width="100%" height="100%">

          <BarChart data={data}>

            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis dataKey="channel" tickLine={false} axisLine={false} />

            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />

            <Tooltip />

            <Bar dataKey="total" fill="#0ea5e9" radius={[10, 10, 0, 0]} />

          </BarChart>

        </ResponsiveContainer>

      </div>

    </section>
  );
}
