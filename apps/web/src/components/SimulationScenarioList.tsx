"use client";

export interface SimulationScenarioItem {
  scenarioName: string;
  inputMessage: string;
  expectedAgent: string;
  expectedAction: string;
}

export function SimulationScenarioList({
  scenarios,
  onRun,
}: {
  scenarios: SimulationScenarioItem[];
  onRun: (scenario: SimulationScenarioItem) => void;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">

      <div className="mb-4">

        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-600">
                    Simulation lab
        </p>

        <h3 className="text-xl font-semibold text-slate-950">Scenarios</h3>

      </div>

      <div className="space-y-4">

        {scenarios.map((scenario) => (
          <article
            key={scenario.scenarioName}
            className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4"
          >

            <p className="text-sm font-semibold text-slate-950">
                            {scenario.scenarioName}

            </p>

            <p className="mt-2 text-sm text-slate-600">
                            {scenario.inputMessage}

            </p>

            <p className="mt-2 text-xs text-slate-500">
                            Expected: {scenario.expectedAgent} /
              {scenario.expectedAction}

            </p>

            <button
              type="button"
              onClick={() => onRun(scenario)}
              className="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
                            Run scenario
            </button>

          </article>
        ))}

      </div>

    </section>
  );
}
