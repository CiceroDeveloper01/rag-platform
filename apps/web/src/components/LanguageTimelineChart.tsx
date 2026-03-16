"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface LanguageTimelineSeries {
  language: string;
  label: string;
  points: Array<{
    date: string;
    count: number;
  }>;
}

const LANGUAGE_COLORS: Record<string, string> = {
  en: "#2563eb",
  pt: "#16a34a",
  es: "#f59e0b",
};

export function LanguageTimelineChart({
  series,
}: {
  series: LanguageTimelineSeries[];
}) {
  const chartData = buildChartData(series);

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">

      <div className="mb-4">

        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">
                    Language timeline
        </p>

        <h3 className="text-xl font-semibold text-slate-950">
                    Tendencia por periodo
        </h3>

      </div>

      {chartData.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-slate-50/80 text-sm text-slate-500">
                    Ainda nao ha dados suficientes para a timeline de idiomas.

        </div>
      ) : (
        <div className="h-72">

          <ResponsiveContainer width="100%" height="100%">

            <LineChart data={chartData}>

              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis dataKey="date" tickLine={false} axisLine={false} />

              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />

              <Tooltip />

              <Legend />

              {series.map((entry) => (
                <Line
                  key={entry.language}
                  type="monotone"
                  dataKey={entry.label}
                  stroke={LANGUAGE_COLORS[entry.language] ?? "#6366f1"}
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
              ))}

            </LineChart>

          </ResponsiveContainer>

        </div>
      )}

    </section>
  );
}

function buildChartData(series: LanguageTimelineSeries[]) {
  const byDate = new Map<string, Record<string, string | number>>();

  for (const entry of series) {
    for (const point of entry.points) {
      const row = byDate.get(point.date) ?? { date: point.date };
      row[entry.label] = point.count;
      byDate.set(point.date, row);
    }
  }

  return Array.from(byDate.values()).sort((left, right) =>
    String(left.date).localeCompare(String(right.date)),
  );
}
