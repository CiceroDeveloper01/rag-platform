"use client";

import { useEffect, useState } from "react";
import { ErrorState } from "@/src/components/states/error-state";
import { LoadingPanel } from "@/src/components/states/loading-panel";
import { PageHeader } from "@/src/components/ui/page-header";
import { SectionCard } from "@/src/components/ui/section-card";
import { StatusPill } from "@/src/components/ui/status-pill";
import { bankingApiService } from "../services/banking-api.service";
import type { CardsWorkspace } from "../types/banking.types";
import { formatCurrency, formatDate } from "../utils/format";
import { ContextualAssistantPanel } from "./contextual-assistant-panel";
import { SourceBadge } from "./source-badge";

export function CardsPage() {
  const [workspace, setWorkspace] = useState<CardsWorkspace | null>(null);
  const [source, setSource] = useState<"api" | "mock">("mock");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  async function load(selectedCardId?: string) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await bankingApiService.getCardsWorkspace(selectedCardId);
      setWorkspace(response.data);
      setSource(response.source);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel carregar os cartoes.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleToggleCard(status: string, cardId: string) {
    const response =
      status === "BLOCKED"
        ? await bankingApiService.unblockCard(cardId)
        : await bankingApiService.blockCard(cardId);

    setActionMessage(response.data.message);
    await load(cardId);
  }

  if (isLoading) {
    return (
      <LoadingPanel
        title="Carregando cartoes"
        description="Buscando detalhes estruturados, limite e fatura para a experiencia de banking."
      />
    );
  }

  if (error || !workspace) {
    return (
      <ErrorState
        title="Nao foi possivel carregar os cartoes"
        description={error ?? "Tente novamente em alguns instantes."}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Cards"
        title="Cartoes com operacao real e suporte contextual"
        description="Consulte status, limite e fatura com cara de internet banking. Operacoes sensiveis continuam protegidas no backend."
        actions={<SourceBadge source={source} />}
      />

      {actionMessage ? (
        <SectionCard className="border-emerald-200 bg-emerald-50 text-emerald-800">
          {actionMessage}
        </SectionCard>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <SectionCard className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Carteira de cartoes
                </div>
                <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                  Produtos ativos do cliente
                </h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {workspace.cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => void load(card.id)}
                  className={`rounded-[26px] border px-5 py-5 text-left transition ${
                    workspace.selectedCard.id === card.id
                      ? "border-teal-300 bg-teal-50 shadow-[0_20px_60px_rgba(13,148,136,0.12)]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-semibold text-slate-950">
                      {card.brand}
                    </div>
                    <StatusPill tone={card.status === "BLOCKED" ? "error" : "success"}>
                      {card.status}
                    </StatusPill>
                  </div>
                  <div className="mt-8 text-sm text-slate-500">
                    Final {card.last4}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {card.holderName}
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Cartao selecionado
                </div>
                <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                  {workspace.selectedCard.brand} final {workspace.selectedCard.last4}
                </h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  void handleToggleCard(
                    workspace.selectedCard.status,
                    workspace.selectedCard.id,
                  )
                }
                className={`rounded-[16px] px-4 py-3 text-sm font-semibold ${
                  workspace.selectedCard.status === "BLOCKED"
                    ? "bg-emerald-600 text-white"
                    : "bg-rose-600 text-white"
                }`}
              >
                {workspace.selectedCard.status === "BLOCKED"
                  ? "Desbloquear cartao"
                  : "Bloquear cartao"}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Limite total
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">
                  {formatCurrency(workspace.limit.totalLimit)}
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Disponivel
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">
                  {formatCurrency(workspace.limit.availableLimit)}
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Fatura
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">
                  {formatCurrency(workspace.invoice.amount)}
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-5">
              <div className="text-sm text-slate-500">Vencimento da fatura</div>
              <div className="mt-2 text-xl font-semibold text-slate-950">
                {formatDate(workspace.invoice.dueDate)}
              </div>
              <div className="mt-2 text-sm text-slate-600">
                Pagamento minimo: {formatCurrency(workspace.invoice.minimumPayment)}
              </div>
            </div>
          </SectionCard>
        </div>

        <ContextualAssistantPanel
          title="Assistente de cartoes"
          contextLabel="Cartoes"
          contextSummary={`${workspace.selectedCard.brand} final ${workspace.selectedCard.last4}, status ${workspace.selectedCard.status}, limite disponivel ${formatCurrency(workspace.limit.availableLimit)}, fatura ${formatCurrency(workspace.invoice.amount)}.`}
          suggestions={[
            "Explique meu limite disponivel e a fatura atual",
            "Como funciona o bloqueio de cartao neste fluxo?",
            "Quais dados o sistema usa para responder sobre cartoes?",
          ]}
        />
      </section>
    </div>
  );
}
