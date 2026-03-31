"use client";

import { useEffect, useState } from "react";
import { ErrorState } from "@/src/components/states/error-state";
import { LoadingPanel } from "@/src/components/states/loading-panel";
import { PageHeader } from "@/src/components/ui/page-header";
import { SectionCard } from "@/src/components/ui/section-card";
import { bankingApiService } from "../services/banking-api.service";
import type {
  InvestmentPortfolio,
  InvestmentProduct,
  InvestmentSimulation,
} from "../types/banking.types";
import { formatCurrency, formatPercent } from "../utils/format";
import { ContextualAssistantPanel } from "./contextual-assistant-panel";
import { SourceBadge } from "./source-badge";

export function InvestmentsPage() {
  const [products, setProducts] = useState<InvestmentProduct[]>([]);
  const [portfolio, setPortfolio] = useState<InvestmentPortfolio | null>(null);
  const [simulation, setSimulation] = useState<InvestmentSimulation | null>(null);
  const [source, setSource] = useState<"api" | "mock">("mock");
  const [amount, setAmount] = useState("5000");
  const [periodInDays, setPeriodInDays] = useState("365");
  const [productType, setProductType] = useState("cdb");
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [productResponse, portfolioResponse] = await Promise.all([
          bankingApiService.getInvestmentProducts(),
          bankingApiService.getInvestmentPortfolio(),
        ]);

        if (!isMounted) {
          return;
        }

        setProducts(productResponse.data);
        setPortfolio(portfolioResponse.data);
        setSource(
          productResponse.source === "api" && portfolioResponse.source === "api"
            ? "api"
            : "mock",
        );
        setProductType(productResponse.data[0]?.type ?? "cdb");
      } catch (requestError) {
        if (!isMounted) {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel carregar investimentos.",
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
      const response = await bankingApiService.simulateInvestment({
        amount: Number(amount),
        periodInDays: Number(periodInDays),
        productType,
      });
      setSimulation(response.data);
      setSource(response.source);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel simular o investimento.",
      );
    } finally {
      setIsSimulating(false);
    }
  }

  if (isLoading) {
    return (
      <LoadingPanel
        title="Carregando investimentos"
        description="Buscando produtos, carteira e dados para simulacao."
      />
    );
  }

  if (error || !portfolio) {
    return (
      <ErrorState
        title="Nao foi possivel carregar investimentos"
        description={error ?? "Tente novamente em alguns instantes."}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Investments"
        title="Investimentos com leitura de carteira e simulacao de produto"
        description="Transformamos produtos e simulacoes em experiencia de fintech, com o assistente atuando como apoio contextual."
        actions={<SourceBadge source={source} />}
      />

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <SectionCard className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Carteira
                </div>
                <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                  Posicao consolidada
                </h2>
              </div>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                {formatCurrency(portfolio.totalInvestedAmount)}
              </div>
            </div>
            <div className="space-y-3">
              {portfolio.positions.map((position) => (
                <div
                  key={position.productId}
                  className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-950">
                      {position.productName}
                    </div>
                    <div className="text-sm font-medium text-slate-600">
                      {formatCurrency(position.investedAmount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard className="space-y-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Produtos
              </div>
              <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                Catalogo disponivel
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-[24px] border border-slate-200 bg-white px-5 py-5"
                >
                  <div className="text-xs uppercase tracking-[0.22em] text-teal-700">
                    {product.type}
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">
                    {product.name}
                  </h3>
                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <div>Aplicacao minima: {formatCurrency(product.minimumAmount)}</div>
                    <div>Taxa anual: {formatPercent(product.annualRate)}</div>
                    <div>Liquidez: {product.liquidity}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard className="space-y-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Simulacao
              </div>
              <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                Projete seu rendimento
              </h2>
            </div>
            <div className="grid gap-4">
              <label className="space-y-2 text-sm text-slate-600">
                Produto
                <select
                  value={productType}
                  onChange={(event) => setProductType(event.target.value)}
                  className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3"
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.type}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                Valor
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                Prazo em dias
                <input
                  value={periodInDays}
                  onChange={(event) => setPeriodInDays(event.target.value)}
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
              {isSimulating ? "Simulando..." : "Simular investimento"}
            </button>

            {simulation ? (
              <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-emerald-700">
                  Resultado projetado
                </div>
                <div className="mt-3 text-3xl font-semibold text-slate-950">
                  {formatCurrency(simulation.projectedAmount)}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  Taxa anual {formatPercent(simulation.annualRate)} para{" "}
                  {simulation.periodInDays} dias.
                </div>
              </div>
            ) : null}
          </SectionCard>

          <ContextualAssistantPanel
            title="Assistente de investimentos"
            contextLabel="Investimentos"
            contextSummary={`Carteira atual ${formatCurrency(portfolio.totalInvestedAmount)} em ${portfolio.positions.length} posicoes. Produto selecionado ${productType}.`}
            suggestions={[
              "Resuma minha carteira e perfil de liquidez",
              "Explique a simulacao atual de forma executiva",
              "Quais produtos combinam com um perfil mais conservador?",
            ]}
          />
        </div>
      </section>
    </div>
  );
}
