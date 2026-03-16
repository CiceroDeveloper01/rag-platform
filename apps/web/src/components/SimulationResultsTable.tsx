"use client";

export interface SimulationResultItem {
  scenarioId: string;
  actualAgent: string;
  actualAction: string;
  score: "PASS" | "FAIL";
  createdAt: string;
}

export function SimulationResultsTable({
  results,
}: {
  results: SimulationResultItem[];
}) {
  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">

      <div className="mb-4">

        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">
                    Results
        </p>

        <h3 className="text-xl font-semibold text-slate-950">
                    Simulation results
        </h3>

      </div>

      <div className="space-y-3">

        {results.length === 0 ? (
          <p className="text-sm text-slate-500">No simulation runs yet.</p>
        ) : (
          results.map((result) => (
            <article
              key={`${result.scenarioId}-${result.createdAt}`}
              className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4"
            >

              <div className="flex items-center justify-between gap-4">

                <p className="text-sm font-semibold text-slate-950">
                                    {result.scenarioId}

                </p>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    result.score === "PASS"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                                    {result.score}

                </span>

              </div>

              <p className="mt-2 text-sm text-slate-600">
                                {result.actualAgent} / {result.actualAction}

              </p>

              <p className="mt-2 text-xs text-slate-500">{result.createdAt}</p>

            </article>
          ))
        )}

      </div>

    </section>
  );
}
