"use client";

import { useState } from "react";
import { PageHeader } from "@/src/components/ui/page-header";
import { SectionCard } from "@/src/components/ui/section-card";
import { ContextualAssistantPanel } from "./contextual-assistant-panel";

const assistantContexts = [
  {
    id: "dashboard",
    label: "Dashboard",
    summary:
      "Visao consolidada de cliente, cartoes, credito, investimentos e monitorias operacionais.",
    suggestions: [
      "Resuma a situacao financeira e operacional atual",
      "O que merece atencao no dashboard hoje?",
      "Explique onde entram tools, conhecimento e monitorias na plataforma",
    ],
  },
  {
    id: "cards",
    label: "Cartoes",
    summary: "Status, limite, fatura, operacoes sensiveis e bloqueio contextual.",
    suggestions: [
      "Como o fluxo de bloqueio funciona?",
      "Explique limite, fatura e status do cartao",
      "Quando o sistema pede confirmacao antes de agir?",
    ],
  },
  {
    id: "credit",
    label: "Credito",
    summary: "Limite disponivel, contratos ativos e simulacoes de proposta.",
    suggestions: [
      "Resuma meu contexto de credito",
      "Explique a simulacao atual",
      "Quais dados vem do backend e quais podem estar mockados?",
    ],
  },
  {
    id: "investments",
    label: "Investimentos",
    summary: "Produtos, carteira e simulacoes de rendimento.",
    suggestions: [
      "Compare produtos de investimento disponiveis",
      "Resuma minha carteira",
      "Explique a diferenca entre produto e simulacao",
    ],
  },
];

export function AssistantPage() {
  const [activeContextId, setActiveContextId] = useState("dashboard");
  const activeContext =
    assistantContexts.find((item) => item.id === activeContextId) ??
    assistantContexts[0];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Assistant"
        title="Assistente inteligente embutido na experiencia bancaria"
        description="Aqui o assistente aparece como funcionalidade do produto. Ele muda de contexto conforme o modulo selecionado e ajuda a navegar pelos dados e operacoes."
      />

      <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <SectionCard className="space-y-5">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Contextos disponiveis
          </div>
          <div className="space-y-3">
            {assistantContexts.map((context) => (
              <button
                key={context.id}
                type="button"
                onClick={() => setActiveContextId(context.id)}
                className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                  context.id === activeContextId
                    ? "border-teal-300 bg-teal-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="font-semibold text-slate-950">{context.label}</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  {context.summary}
                </div>
              </button>
            ))}
          </div>
        </SectionCard>

        <ContextualAssistantPanel
          title={`Assistente de ${activeContext.label.toLowerCase()}`}
          contextLabel={activeContext.label}
          contextSummary={activeContext.summary}
          suggestions={activeContext.suggestions}
        />
      </section>
    </div>
  );
}
