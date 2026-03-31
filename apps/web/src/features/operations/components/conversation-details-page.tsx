"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorState } from "@/src/components/states/error-state";
import { LoadingPanel } from "@/src/components/states/loading-panel";
import { PageHeader } from "@/src/components/ui/page-header";
import { SectionCard } from "@/src/components/ui/section-card";
import { StatusPill } from "@/src/components/ui/status-pill";
import { operationsApiService } from "../services/operations-api.service";
import type { ConversationDetail } from "../types/operations.types";

export function ConversationDetailsPage({ id }: { id: string }) {
  const [details, setDetails] = useState<ConversationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await operationsApiService.getConversationDetail(id);
        if (active) {
          setDetails(response);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Nao foi possivel carregar o detalhe da conversa.",
          );
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  if (!details && !error) {
    return (
      <LoadingPanel
        title="Abrindo a conversa"
        description="Consultando timeline, metadados e sinais operacionais da sessao."
      />
    );
  }

  if (error || !details) {
    return (
      <ErrorState
        title="Nao foi possivel abrir a conversa"
        description={error ?? "Tente novamente em alguns instantes."}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Conversation detail"
        title={`Sessao ${details.summary.sessionId}`}
        description="Abertura operacional da conversa, com timeline, metadados de fluxo e sinais uteis para acompanhamento."
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusPill tone="info">{details.summary.channel}</StatusPill>
            <StatusPill tone="neutral">{details.summary.flowType}</StatusPill>
            <Link
              href="/conversations"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600"
            >
              Voltar
            </Link>
          </div>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard className="space-y-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Timeline
            </div>
            <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
              Interacao acompanhada
            </h2>
          </div>
          <div className="space-y-3">
            {details.timeline.map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {item.role}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(item.timestamp).toLocaleString("pt-BR")}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Routing snapshot
            </div>
            <div className="grid gap-3 text-sm text-slate-600">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">Intent:</span> {details.intent ?? "n/a"}
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">Specialist:</span> {details.specialist ?? "n/a"}
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">Tools:</span> {details.tools.length ? details.tools.join(", ") : "nenhuma"}
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">Confirmation:</span> {details.pendingConfirmation ? "pendente" : "resolvida"}
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">Handoff:</span> {details.handoffRequested ? "solicitado" : "nao"}
              </div>
            </div>
          </SectionCard>

          <SectionCard className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Technical metadata
            </div>
            <div className="grid gap-3 text-sm text-slate-600">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">CorrelationId:</span> {details.correlationId}
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">Tenant:</span> {details.summary.tenantId}
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">Latency:</span> {details.latencyMs ? `${details.latencyMs} ms` : "n/a"}
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">Metadata source:</span> {details.metadataSource}
              </div>
            </div>
          </SectionCard>
        </div>
      </section>
    </div>
  );
}
