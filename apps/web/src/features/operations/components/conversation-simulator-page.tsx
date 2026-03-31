"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/src/components/ui/page-header";
import { SectionCard } from "@/src/components/ui/section-card";
import { StatusPill } from "@/src/components/ui/status-pill";
import { chatApiService } from "@/src/features/chat/services/chat-api.service";
import { simulationApiService } from "@/src/services/simulation-api.service";
import type { SimulatorSession, SimulatorTelemetry } from "../types/operations.types";

const scenarioSuggestions = [
  {
    label: "Perdi meu cartao",
    channel: "WHATSAPP" as const,
    context: "cards" as const,
    prompt: "Perdi meu cartao e preciso bloquear agora",
  },
  {
    label: "Simular investimento",
    channel: "WEB" as const,
    context: "investments" as const,
    prompt: "Quero investir 5000 em CDB por 12 meses",
  },
  {
    label: "Pedir humano",
    channel: "TELEGRAM" as const,
    context: "credit" as const,
    prompt: "Quero falar com um humano sobre minha proposta de credito",
  },
];

const initialSimulatorSession = createSession("WEB", "dashboard");

function createSession(
  channel: SimulatorSession["channel"],
  context: SimulatorSession["context"],
): SimulatorSession {
  const now = new Date().toISOString();
  return {
    id: `sim-${Date.now()}`,
    title: `Sessao ${channel.toLowerCase()} ${context}`,
    channel,
    context,
    status: "idle",
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: `sys-${Date.now()}`,
        role: "system",
        content:
          "Sessao de simulacao pronta. Escolha canal, contexto e envie mensagens para validar o comportamento da plataforma.",
        createdAt: now,
      },
    ],
    telemetry: null,
  };
}

function createTelemetry(
  question: string,
  context: SimulatorSession["context"],
  latencyMs: number,
  previousTelemetry: SimulatorTelemetry | null,
): SimulatorTelemetry {
  const normalized = question.toLowerCase();
  const handoffRequested =
    normalized.includes("humano") || normalized.includes("human");
  const pendingConfirmation =
    (normalized.includes("perdi") || normalized.includes("lost")) &&
    !normalized.includes("confirm");

  const intent =
    context === "cards"
      ? "CARD_SERVICES"
      : context === "credit"
        ? "CREDIT_REQUEST"
        : context === "investments"
          ? "INVESTMENT_ADVISORY"
          : context === "customer"
            ? "ACCOUNT_SERVICES"
            : "FAQ_INSTITUTIONAL";

  const specialist =
    context === "cards"
      ? "CardSpecialist"
      : context === "credit"
        ? "CreditSpecialist"
        : context === "investments"
          ? "InvestmentSpecialist"
          : context === "customer"
            ? "AccountSpecialist"
            : "FaqSpecialist";

  const tools =
    context === "cards"
      ? normalized.includes("bloquear") || normalized.includes("perdi")
        ? ["BlockCardTool"]
        : ["GetCardInfoTool"]
      : context === "credit"
        ? ["SimulateCreditTool"]
        : context === "investments"
          ? ["SimulateInvestmentTool"]
          : ["GetCustomerProfileTool"];

  const flowType = handoffRequested
    ? "handoff"
    : pendingConfirmation
      ? "sensitive-operation"
      : normalized.includes("simular") ||
          normalized.includes("investir") ||
          normalized.includes("limite")
        ? "tool-only"
        : "knowledge-assisted";

  return {
    intent,
    specialist,
    flowType,
    tools,
    handoffRequested,
    pendingConfirmation:
      pendingConfirmation ||
      (Boolean(previousTelemetry?.pendingConfirmation) &&
        !normalized.includes("confirmo") &&
        !normalized.includes("confirm") &&
        !normalized.includes("yes")),
    latencyMs,
    correlationId: `sim-${Date.now()}`,
    metadataSource: "simulated",
  };
}

export function ConversationSimulatorPage() {
  const [channel, setChannel] = useState<SimulatorSession["channel"]>("WEB");
  const [context, setContext] = useState<SimulatorSession["context"]>("dashboard");
  const [sessions, setSessions] = useState<SimulatorSession[]>([
    initialSimulatorSession,
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>(
    initialSimulatorSession.id,
  );
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  const activeSession =
    sessions.find((session) => session.id === activeSessionId) ?? sessions[0];

  function syncSession(nextSession: SimulatorSession) {
    setSessions((current) => [
      nextSession,
      ...current.filter((item) => item.id !== nextSession.id),
    ]);
    setActiveSessionId(nextSession.id);
  }

  function handleCreateSession() {
    const nextSession = createSession(channel, context);
    syncSession(nextSession);
  }

  async function handleUseSuggestion(
    suggestion: (typeof scenarioSuggestions)[number],
  ) {
    const nextSession = createSession(suggestion.channel, suggestion.context);
    syncSession(nextSession);
    setDraft(suggestion.prompt);

    try {
      await simulationApiService.runScenario({
        scenarioName: suggestion.label,
        inputMessage: suggestion.prompt,
        expectedAgent: suggestion.context,
        expectedAction: "validate",
      });
    } catch {
      // The simulator should stay useful even if the scenario API is unavailable.
    }
  }

  async function handleSend() {
    if (!activeSession || !draft.trim()) {
      return;
    }

    const question = draft.trim();
    const now = new Date().toISOString();
    const seededSession: SimulatorSession = {
      ...activeSession,
      status: "running",
      updatedAt: now,
      messages: [
        ...activeSession.messages,
        {
          id: `user-${Date.now()}`,
          role: "user",
          content: question,
          createdAt: now,
        },
      ],
    };
    syncSession(seededSession);
    setDraft("");
    setIsSending(true);
    const startedAt = performance.now();

    try {
      const response = await chatApiService.askQuestion({
        question: `Canal simulado: ${seededSession.channel}. Contexto: ${seededSession.context}. Pedido do usuario: ${question}`,
        topK: 4,
        maxContextCharacters: 4000,
      });

      const latencyMs = Math.round(performance.now() - startedAt);
      const telemetry = createTelemetry(
        question,
        seededSession.context,
        latencyMs,
        seededSession.telemetry,
      );

      const finalizedSession: SimulatorSession = {
        ...seededSession,
        status: telemetry.handoffRequested
          ? "handoff"
          : telemetry.pendingConfirmation
            ? "attention"
            : "idle",
        updatedAt: new Date().toISOString(),
        telemetry,
        messages: [
          ...seededSession.messages,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: response.answer,
            createdAt: new Date().toISOString(),
          },
        ],
      };

      syncSession(finalizedSession);
    } catch (error) {
      const failedSession: SimulatorSession = {
        ...seededSession,
        status: "attention",
        updatedAt: new Date().toISOString(),
        messages: [
          ...seededSession.messages,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content:
              error instanceof Error
                ? error.message
                : "Nao foi possivel concluir a simulacao agora.",
            createdAt: new Date().toISOString(),
          },
        ],
      };
      syncSession(failedSession);
    } finally {
      setIsSending(false);
    }
  }

  const telemetry = activeSession?.telemetry;

  const sessionCountLabel = useMemo(
    () => `${sessions.length} sessao${sessions.length === 1 ? "" : "es"}`,
    [sessions.length],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Conversation simulator"
        title="Ambiente controlado para validar interacoes da plataforma"
        description="O simulador separa claramente teste e demonstracao das conversas reais. Ele permite escolher canal, contexto e observar sinais de roteamento sem transformar a Web em um chat genérico."
        actions={<StatusPill tone="info">{sessionCountLabel}</StatusPill>}
      />

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.18fr_0.84fr]">
        <SectionCard className="space-y-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Session setup
            </div>
            <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
              Canal e contexto
            </h2>
          </div>

          <label className="space-y-2 text-sm text-slate-600">
            Canal
            <select
              value={channel}
              onChange={(event) =>
                setChannel(event.target.value as SimulatorSession["channel"])
              }
              className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3"
            >
              <option value="WEB">Web</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="TELEGRAM">Telegram</option>
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-600">
            Contexto
            <select
              value={context}
              onChange={(event) =>
                setContext(event.target.value as SimulatorSession["context"])
              }
              className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3"
            >
              <option value="dashboard">Dashboard / geral</option>
              <option value="cards">Cards</option>
              <option value="credit">Credit</option>
              <option value="investments">Investments</option>
              <option value="customer">Customer</option>
            </select>
          </label>

          <button
            type="button"
            onClick={handleCreateSession}
            className="w-full rounded-[16px] bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
          >
            Iniciar sessao simulada
          </button>

          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Scenarios
            </div>
            {scenarioSuggestions.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                onClick={() => void handleUseSuggestion(suggestion)}
                className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-slate-300"
              >
                <div className="font-medium text-slate-950">{suggestion.label}</div>
                <div className="mt-2 text-sm text-slate-600">{suggestion.prompt}</div>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Sessoes simuladas
            </div>
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setActiveSessionId(session.id)}
                className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                  session.id === activeSession?.id
                    ? "border-teal-300 bg-teal-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-slate-950">{session.title}</div>
                  <StatusPill tone="neutral">{session.status}</StatusPill>
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {session.channel} / {session.context}
                </div>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard className="space-y-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Conversation
            </div>
            <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
              Interacao simulada
            </h2>
          </div>

          <div className="space-y-3">
            {activeSession?.messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-[24px] px-4 py-4 text-sm leading-7 ${
                  message.role === "user"
                    ? "ml-auto max-w-[86%] bg-slate-950 text-white"
                    : message.role === "assistant"
                      ? "mr-auto max-w-[88%] border border-slate-200 bg-slate-50 text-slate-700"
                      : "border border-dashed border-slate-300 bg-white text-slate-500"
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={4}
              placeholder="Envie uma mensagem para testar o orchestrator neste contexto..."
              className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={isSending}
              className="rounded-[16px] bg-teal-600 px-4 py-3 text-sm font-semibold text-white"
            >
              {isSending ? "Executando..." : "Enviar simulacao"}
            </button>
          </div>
        </SectionCard>

        <SectionCard className="space-y-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Interaction state
            </div>
            <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
              Sinais tecnicos
            </h2>
          </div>

          {telemetry ? (
            <div className="grid gap-3 text-sm text-slate-600">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">Intent:</span> {telemetry.intent}
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">Specialist:</span> {telemetry.specialist}
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">Flow:</span> {telemetry.flowType}
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">Tools:</span> {telemetry.tools.join(", ")}
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">Handoff:</span> {telemetry.handoffRequested ? "sim" : "nao"}
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">Confirmacao:</span> {telemetry.pendingConfirmation ? "pendente" : "resolvida"}
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">Latency:</span> {telemetry.latencyMs} ms
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">CorrelationId:</span> {telemetry.correlationId}
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-600">
              Envie uma mensagem para gerar sinais operacionais desta sessao simulada.
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
