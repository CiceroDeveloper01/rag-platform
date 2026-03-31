"use client";

import { useEffect, useState } from "react";
import { ErrorState } from "@/src/components/states/error-state";
import { LoadingPanel } from "@/src/components/states/loading-panel";
import { PageHeader } from "@/src/components/ui/page-header";
import { SectionCard } from "@/src/components/ui/section-card";
import { bankingApiService } from "../services/banking-api.service";
import type { CreditContract, CreditLimit, CreditSimulation } from "../types/banking.types";
import { formatCurrency, formatDate, formatPercent } from "../utils/format";
import { ContextualAssistantPanel } from "./contextual-assistant-panel";
import { SourceBadge } from "./source-badge";

export function CreditPage() {
  const [creditLimit, setCreditLimit] = useState<CreditLimit | null>(null);
  const [contracts, setContracts] = useState<CreditContract[]>([]);
  const [source, setSource] = useState<"api" | "mock">("mock");
  const [simulation, setSimulation] = useState<CreditSimulation | null>(null);
  const [requestedAmount, setRequestedAmount] = useState("12000");
  const [installmentCount, setInstallmentCount] = useState("12");
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [limit, contractList] = await Promise.all([
          bankingApiService.getCreditLimit(),
          bankingApiService.getCreditContracts(),
        ]);

        if (!isMounted) {
          return;
        }

        setCreditLimit(limit.data);
        setContracts(contractList.data);
        setSource(limit.source === "api" && contractList.source === "api" ? "api" : "mock");
      } catch (requestError) {
        if (!isMounted) {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel carregar o modulo de credito.",
        );
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
  }, []);

  async function handleSimulate() {
    setIsSimulating(true);
    setError(null);

    try {
      const response = await bankingApiService.simulateCredit({
        requestedAmount: Number(requestedAmount),
        installmentCount: Number(installmentCount),
      });
      setSimulation(response.data);
      setSource(response.source);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel simular o credito.",
      );
    } finally {
      setIsSimulating(false);
    }
  }

  if (isLoading) {
    return (
      <LoadingPanel
        title="Carregando credito"
        description="Buscando limite pre-aprovado e contratos para o painel financeiro."
      />
    );
  }

  if (error || !creditLimit) {
    return (
      <ErrorState
        title="Nao foi possivel carregar credito"
        description={error ?? "Tente novamente em alguns instantes."}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Credit"
        title="Credito com simulacao imediata e carteira ativa"
        description="Visualize limite disponivel, acompanhe contratos e simule propostas em uma UX de produto financeiro."
        actions={<SourceBadge source={source} />}
      />

      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-6">
          <SectionCard className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Limite total
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">
                  {formatCurrency(creditLimit.totalLimit)}
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Disponivel
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">
                  {formatCurrency(creditLimit.availableLimit)}
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Elegibilidade
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">
                  {creditLimit.preApproved ? "Pre-aprovado" : "Analise"}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard className="space-y-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Simulacao
              </div>
              <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                Simule sua proposta
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-600">
                Valor desejado
                <input
                  value={requestedAmount}
                  onChange={(event) => setRequestedAmount(event.target.value)}
                  className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                Parcelas
                <input
                  value={installmentCount}
                  onChange={(event) => setInstallmentCount(event.target.value)}
                  className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => void handleSimulate()}
              disabled={isSimulating}
              className="rounded-[16px] bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
            >
              {isSimulating ? "Simulando..." : "Simular credito"}
            </button>

            {simulation ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    Parcela mensal
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-slate-950">
                    {formatCurrency(simulation.monthlyInstallment)}
                  </div>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    Taxa estimada
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-slate-950">
                    {formatPercent(simulation.estimatedRate)}
                  </div>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 md:col-span-2">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    Valor total estimado
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-slate-950">
                    {formatCurrency(simulation.totalAmount)}
                  </div>
                </div>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard className="space-y-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Contratos
              </div>
              <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                Operacoes em carteira
              </h2>
            </div>
            <div className="space-y-3">
              {contracts.map((contract) => (
                <div
                  key={contract.contractId}
                  className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-950">
                      {contract.productName}
                    </div>
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      {contract.status}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    Saldo: {formatCurrency(contract.outstandingBalance)}
                  </div>
                  <div className="text-sm text-slate-600">
                    Proximo vencimento: {formatDate(contract.nextDueDate)}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <ContextualAssistantPanel
          title="Assistente de credito"
          contextLabel="Credito"
          contextSummary={`Limite disponivel ${formatCurrency(creditLimit.availableLimit)}. Contratos ativos ${contracts.length}. Simulacao atual ${simulation ? formatCurrency(simulation.totalAmount) : "nao realizada"}.`}
          suggestions={[
            "Resuma meu limite e minhas possibilidades de credito",
            "Explique a simulacao atual em linguagem simples",
            "Quais riscos ou guardrails existem em operacoes sensiveis?",
          ]}
        />
      </section>
    </div>
  );
}
