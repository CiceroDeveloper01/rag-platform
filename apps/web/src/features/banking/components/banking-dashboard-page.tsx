"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/src/components/ui/page-header";
import { SectionCard } from "@/src/components/ui/section-card";
import { ErrorState } from "@/src/components/states/error-state";
import { LoadingPanel } from "@/src/components/states/loading-panel";
import { analyticsApiService } from "@/src/services/analytics-api.service";
import { observabilityApiService } from "@/src/features/observability/services/observability-api.service";
import { omnichannelService } from "@/src/features/omnichannel/services/omnichannel.service";
import { bankingApiService } from "../services/banking-api.service";
import { formatCurrency } from "../utils/format";
import { ContextualAssistantPanel } from "./contextual-assistant-panel";
import { FinancialStatCard } from "./financial-stat-card";
import { SourceBadge } from "./source-badge";

export function BankingDashboardPage() {
  const [state, setState] = useState<{
    customerName: string;
    customerSource: "api" | "mock";
    segment: string;
    activeProducts: number;
    cardsSource: "api" | "mock";
    cardBrand: string;
    cardStatus: string;
    availableLimit: number;
    invoiceAmount: number;
    portfolioSource: "api" | "mock";
    investedAmount: number;
    creditSource: "api" | "mock";
    creditAvailable: number;
    healthStatus: string;
    totalRequests: number;
    p95LatencyMs: number;
    toolOnlyRate: number;
    totalAiCost: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [
          profile,
          summary,
          cardsWorkspace,
          portfolio,
          creditLimit,
          health,
          overview,
          ragUsage,
          aiCost,
        ] = await Promise.all([
          bankingApiService.getCustomerProfile(),
          bankingApiService.getCustomerSummary(),
          bankingApiService.getCardsWorkspace(),
          bankingApiService.getInvestmentPortfolio(),
          bankingApiService.getCreditLimit(),
          observabilityApiService.getHealth().catch(() => null),
          omnichannelService.getOverview().catch(() => null),
          omnichannelService.getRagUsage().catch(() => null),
          analyticsApiService.getAiCost().catch(() => ({ totalCost: 0 })),
        ]);

        if (!isMounted) {
          return;
        }

        setState({
          customerName: profile.data.fullName,
          customerSource: profile.source,
          segment: profile.data.segment,
          activeProducts: summary.data.activeProducts,
          cardsSource: cardsWorkspace.source,
          cardBrand: cardsWorkspace.data.selectedCard.brand,
          cardStatus: cardsWorkspace.data.selectedCard.status,
          availableLimit: cardsWorkspace.data.limit.availableLimit,
          invoiceAmount: cardsWorkspace.data.invoice.amount,
          portfolioSource: portfolio.source,
          investedAmount: portfolio.data.totalInvestedAmount,
          creditSource: creditLimit.source,
          creditAvailable: creditLimit.data.availableLimit,
          healthStatus: health?.status ?? "degraded",
          totalRequests: overview?.totalRequests ?? 1248,
          p95LatencyMs: overview?.p95LatencyMs ?? 186,
          toolOnlyRate: ragUsage ? 100 - ragUsage.ragUsagePercentage : 68,
          totalAiCost: aiCost.totalCost ?? 0,
        });
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel carregar o dashboard bancario.",
        );
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!state && !error) {
    return (
      <LoadingPanel
        title="Montando o dashboard bancario"
        description="Consolidando cliente, cartoes, credito, investimentos e monitorias da plataforma."
      />
    );
  }

  if (error || !state) {
    return (
      <ErrorState
        title="Nao foi possivel abrir o dashboard"
        description={error ?? "Tente novamente em alguns instantes."}
      />
    );
  }

  const customerFirstName = state.customerName.split(" ")[0] ?? "cliente";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Digital banking"
        title={`Bom dia, ${customerFirstName}. Seu banco digital com IA ja esta em operacao.`}
        description="O dashboard coloca dominio bancario, assistente inteligente e monitorias operacionais na mesma experiencia, com cara de produto financeiro real."
        actions={<SourceBadge source={state.customerSource} />}
      />

      <section className="grid gap-5 xl:grid-cols-4">
        <FinancialStatCard
          label="Limite disponivel"
          value={formatCurrency(state.availableLimit)}
          description={`${state.cardBrand} em ${state.cardStatus.toLowerCase()}.`}
          tone="success"
        />
        <FinancialStatCard
          label="Fatura atual"
          value={formatCurrency(state.invoiceAmount)}
          description="Visibilidade imediata para a proxima data de fechamento."
          tone="info"
        />
        <FinancialStatCard
          label="Investimentos"
          value={formatCurrency(state.investedAmount)}
          description="Patrimonio investido consolidado na carteira."
          tone="warning"
        />
        <FinancialStatCard
          label="Credito pre-aprovado"
          value={formatCurrency(state.creditAvailable)}
          description="Limite pronto para simulacoes e propostas."
          tone="neutral"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <SectionCard className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Relacionamento
                </div>
                <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                  Visao consolidada do cliente
                </h2>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700">
                {state.segment}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Produtos ativos
                </div>
                <div className="mt-3 text-3xl font-semibold text-slate-950">
                  {state.activeProducts}
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Throughput 24h
                </div>
                <div className="mt-3 text-3xl font-semibold text-slate-950">
                  {state.totalRequests}
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  p95 operacional
                </div>
                <div className="mt-3 text-3xl font-semibold text-slate-950">
                  {state.p95LatencyMs} ms
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Modulos principais
                </div>
                <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                  Acesse operacoes reais do produto
                </h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  href: "/cards",
                  title: "Cartoes",
                  description: "Status, limite, fatura e bloqueio seguro.",
                },
                {
                  href: "/credit",
                  title: "Credito",
                  description: "Limite disponivel, contratos e simulacao.",
                },
                {
                  href: "/investments",
                  title: "Investimentos",
                  description: "Carteira, produtos e simulacoes de rendimento.",
                },
                {
                  href: "/conversations",
                  title: "Conversations",
                  description: "Sessoes reais vindas de Web, WhatsApp e Telegram.",
                },
                {
                  href: "/conversation-simulator",
                  title: "Simulator",
                  description: "Teste multi-turn, handoff e sinais operacionais.",
                },
                {
                  href: "/observability",
                  title: "Monitorias",
                  description: "Health, latencia e acompanhamento operacional.",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[24px] border border-slate-200 bg-white px-5 py-5 transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_24px_60px_rgba(8,32,50,0.08)]"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
                    Modulo
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <ContextualAssistantPanel
            title="Assistente do painel"
            contextLabel="Dashboard financeiro"
            contextSummary={`Cliente ${state.customerName}, segmento ${state.segment}, limite disponivel ${formatCurrency(state.availableLimit)}, investimentos ${formatCurrency(state.investedAmount)}, p95 ${state.p95LatencyMs} ms.`}
            suggestions={[
              "Resuma minha posicao financeira atual",
              "Quais produtos bancarios merecem atencao agora?",
              "Explique a diferenca entre fluxo tool-only e assistido por conhecimento",
            ]}
          />

          <SectionCard className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Platform insights
            </div>
            <div className="grid gap-3">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-sm text-slate-500">Saude da API</div>
                <div className="mt-1 text-2xl font-semibold text-slate-950">
                  {state.healthStatus}
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-sm text-slate-500">Fluxos tool-only</div>
                <div className="mt-1 text-2xl font-semibold text-slate-950">
                  {state.toolOnlyRate.toFixed(0)}%
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-sm text-slate-500">Custo de IA</div>
                <div className="mt-1 text-2xl font-semibold text-slate-950">
                  {formatCurrency(state.totalAiCost)}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </section>
    </div>
  );
}
