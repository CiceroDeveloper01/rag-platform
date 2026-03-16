"use client";

export interface LanguageDistributionEntry {
  language: string;
  label: string;
  count: number;
}

const LANGUAGE_ICONS: Record<string, string> = {
  en: "EN",
  pt: "PT",
  es: "ES",
};

export function LanguageDistributionPanel({
  data,
  total,
}: {
  data: LanguageDistributionEntry[];
  total: number;
}) {
  const dominant = data[0];
  const second = data[1];
  const activeLanguages = data.length;

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(99,102,241,0.08),rgba(255,255,255,0.95))] p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">

      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>

          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-600">
                        Global language presence
          </p>

          <h3 className="text-xl font-semibold text-slate-950">
                        Idiomas de interacao
          </h3>

          <p className="mt-2 max-w-2xl text-sm text-slate-600">
                        Visao executiva dos idiomas dominantes nas conversas processadas
                        pelo orchestrator.
          </p>

        </div>

        <div className="rounded-full border border-indigo-200 bg-white/90 px-4 py-2 text-sm font-medium text-indigo-700">
                    {total} interacoes
        </div>

      </div>

      {data.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-500">
                    Nenhum idioma foi detectado ainda.
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">

          <div className="grid gap-4 md:grid-cols-3">

            <MetricCard
              label="Idioma dominante"
              value={dominant?.label ?? "N/A"}
              hint={
                dominant
                  ? `${toPercent(dominant.count, total)} do total`
                  : "Sem dados"
              }
            />

            <MetricCard
              label="Idiomas ativos"
              value={String(activeLanguages)}
              hint="Distribuicao em tempo real"
            />

            <MetricCard
              label="Segundo idioma"
              value={second?.label ?? "N/A"}
              hint={
                second
                  ? `${toPercent(second.count, total)} do total`
                  : "Sem segundo idioma ainda"
              }
            />

          </div>

          <div className="space-y-3">

            {data.map((entry) => {
              const percentage = toPercent(entry.count, total);

              return (
                <article
                  key={entry.language}
                  className="rounded-[22px] border border-slate-200/80 bg-white/90 p-4"
                >

                  <div className="flex items-center justify-between gap-3">

                    <div className="flex items-center gap-3">

                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-700">

                        {LANGUAGE_ICONS[entry.language] ??
                          entry.language.toUpperCase()}

                      </span>

                      <div>

                        <p className="text-sm font-semibold text-slate-950">
                                                    {entry.label}

                        </p>

                        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                                                    {entry.language}

                        </p>

                      </div>

                    </div>

                    <div className="text-right">

                      <p className="text-sm font-semibold text-slate-950">
                                                {percentage}

                      </p>

                      <p className="text-xs text-slate-500">
                                                {entry.count} eventos

                      </p>

                    </div>

                  </div>

                  <div className="mt-3 h-2 rounded-full bg-slate-100">

                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{
                        width: `${Math.max((entry.count / Math.max(total, 1)) * 100, 6)}%`,
                      }}
                    />

                  </div>

                </article>
              );
            })}

          </div>

        </div>
      )}

    </section>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="rounded-[24px] border border-white/80 bg-white/90 p-5 shadow-[0_18px_60px_-50px_rgba(15,23,42,0.45)]">

      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {label}

      </p>

      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
            <p className="mt-2 text-sm text-slate-600">{hint}</p>

    </article>
  );
}

function toPercent(value: number, total: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}
