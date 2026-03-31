"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorState } from "@/src/components/states/error-state";
import { LoadingPanel } from "@/src/components/states/loading-panel";
import { PageHeader } from "@/src/components/ui/page-header";
import { SectionCard } from "@/src/components/ui/section-card";
import { StatusCard } from "@/src/components/ui/status-card";
import { StatusPill } from "@/src/components/ui/status-pill";
import { operationsApiService } from "../services/operations-api.service";
import type { ConversationSummaryItem, ConversationWorkspace } from "../types/operations.types";

function channelTone(channel: ConversationSummaryItem["channel"]) {
  if (channel === "WHATSAPP") {
    return "success";
  }
  if (channel === "TELEGRAM") {
    return "info";
  }
  return "neutral";
}

export function ConversationsPage() {
  const [workspace, setWorkspace] = useState<ConversationWorkspace | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await operationsApiService.getConversationsWorkspace();
        if (active) {
          setWorkspace(response);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Nao foi possivel carregar as conversas.",
          );
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  if (!workspace && !error) {
    return (
      <LoadingPanel
        title="Montando a central de conversas"
        description="Consolidando sessoes omnichannel, sinais de fluxo e atividade operacional."
      />
    );
  }

  if (error || !workspace) {
    return (
      <ErrorState
        title="Nao foi possivel abrir Conversations"
        description={error ?? "Tente novamente em alguns instantes."}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Conversations"
        title="Sessoes reais do ecossistema omnichannel"
        description="Aqui a Web deixa claro que a plataforma acompanha interacoes vindas de Web, WhatsApp e Telegram em uma unica visao operacional."
        actions={
          <StatusPill tone={workspace.source === "api" ? "success" : "warning"}>
            {workspace.source === "api" ? "Live data" : "Mock operacional"}
          </StatusPill>
        }
      />

      <section className="grid gap-5 xl:grid-cols-4">
        <StatusCard
          title="Conversas ativas"
          value={String(workspace.highlighted.total)}
          tone="info"
          description="Sessoes recentes visiveis no portal."
        />
        <StatusCard
          title="Handoffs"
          value={String(workspace.highlighted.handoffs)}
          tone="warning"
          description="Fluxos que exigiram escalacao humana."
        />
        <StatusCard
          title="Tool-only"
          value={`${workspace.highlighted.toolOnlyRate}%`}
          tone="success"
          description="Participacao de fluxos deterministas no recorte."
        />
        <StatusCard
          title="Canais"
          value={`${workspace.highlighted.byChannel.WEB}/${workspace.highlighted.byChannel.WHATSAPP}/${workspace.highlighted.byChannel.TELEGRAM}`}
          tone="neutral"
          description="Web, WhatsApp e Telegram no mesmo ecossistema."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Queue view
              </div>
              <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                Conversas monitoradas
              </h2>
            </div>
            <Link
              href="/handoffs"
              className="text-sm font-medium text-sky-700 transition hover:text-sky-800"
            >
              Ver handoffs
            </Link>
          </div>

          <div className="space-y-3">
            {workspace.conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/conversations/${conversation.id}`}
                className="block rounded-[26px] border border-slate-200 bg-white px-5 py-5 transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_24px_60px_rgba(8,32,50,0.08)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-950">
                      {conversation.customerName}
                    </div>
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      {conversation.sessionId}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={channelTone(conversation.channel)}>
                      {conversation.channel}
                    </StatusPill>
                    <StatusPill tone="neutral">{conversation.flowType}</StatusPill>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {conversation.lastMessage}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <span>{conversation.status}</span>
                  <span>{conversation.domainContext}</span>
                  <span>{conversation.tenantId}</span>
                  <span>
                    {new Date(conversation.lastActivityAt).toLocaleString("pt-BR")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard className="space-y-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Omnichannel stance
            </div>
            <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
              O que esta visivel nesta area
            </h2>
          </div>
          <div className="grid gap-3 text-sm text-slate-600">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
              Conversas originadas fora da Web podem ser acompanhadas aqui sem mudar de contexto.
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
              Cada sessao destaca canal, tipo de fluxo, tenant, atividade recente e acesso ao detalhe operacional.
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
              A tela serve como ponte entre produto bancario, operacao omnichannel e monitorias da plataforma.
            </div>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
