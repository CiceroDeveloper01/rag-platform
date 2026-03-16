"use client";

import { useEffect, useState } from "react";
import {
  SimulationScenarioList,
  type SimulationScenarioItem,
} from "@/src/components/SimulationScenarioList";
import {
  SimulationResultsTable,
  type SimulationResultItem,
} from "@/src/components/SimulationResultsTable";
import { ErrorState } from "@/src/components/states/error-state";
import { LoadingPanel } from "@/src/components/states/loading-panel";
import { EmptyState } from "@/src/components/ui/empty-state";
import { simulationApiService } from "@/src/services/simulation-api.service";

export function SimulationLabPage() {
  const [scenarios, setScenarios] = useState<SimulationScenarioItem[]>([]);
  const [results, setResults] = useState<SimulationResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunningScenario, setIsRunningScenario] = useState(false);
  const [reloadSeed, setReloadSeed] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await simulationApiService.getScenarios();
        if (!isMounted) {
          return;
        }

        setScenarios(
          Array.isArray(response.scenarios) ? response.scenarios : [],
        );
        setResults(Array.isArray(response.results) ? response.results : []);
      } catch {
        if (!isMounted) {
          return;
        }

        setError("Nao foi possivel carregar os cenarios de simulacao.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [reloadSeed]);

  async function handleRun(scenario: SimulationScenarioItem) {
    setIsRunningScenario(true);
    setError(null);

    try {
      const result = await simulationApiService.runScenario(scenario);
      setResults((current) => [result, ...current].slice(0, 30));
    } catch {
      setError("Nao foi possivel executar o cenario agora.");
    } finally {
      setIsRunningScenario(false);
    }
  }

  function renderContent() {
    if (isLoading) {
      return (
        <LoadingPanel
          title="Carregando simulacoes"
          description="Buscando cenarios e ultimos resultados para montar o laboratorio."
        />
      );
    }

    if (error && scenarios.length === 0 && results.length === 0) {
      return (
        <ErrorState
          title="Nao foi possivel abrir o simulation lab"
          description={error}
          action={
            <button
              type="button"
              onClick={() => setReloadSeed((current) => current + 1)}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
                            Tentar novamente
            </button>
          }
        />
      );
    }

    if (scenarios.length === 0 && results.length === 0) {
      return (
        <EmptyState
          title="Ainda nao ha cenarios cadastrados"
          description="Assim que cenarios de simulacao forem publicados, voce podera testar agentes e comparar resultados aqui."
        />
      );
    }

    return (
      <>

        {error ? (
          <ErrorState
            title="Execucao indisponivel"
            description={error}
            action={
              isRunningScenario ? (
                <span className="text-sm font-medium text-slate-600">
                                    Executando...
                </span>
              ) : null
            }
          />
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">

          <SimulationScenarioList scenarios={scenarios} onRun={handleRun} />

          <SimulationResultsTable results={results} />

        </div>

      </>
    );
  }

  return (
    <div className="space-y-8">

      <section className="rounded-[32px] border border-slate-200/80 bg-white/80 p-6 shadow-[0_36px_120px_-72px_rgba(15,23,42,0.45)] backdrop-blur">

        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-violet-600">
                    Simulation lab
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
                    Teste agentes antes de producao
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-slate-600">
                    Rode cenarios controlados, confira o agente selecionado e acompanhe o
                    score de validacao antes de publicar mudancas.
        </p>

      </section>
            {renderContent()}

    </div>
  );
}
