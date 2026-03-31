"use client";

import { useEffect, useMemo, useState } from "react";
import { AgentTraceViewer } from "@/src/command-center/components/AgentTraceViewer";
import { EvaluationPanel } from "@/src/command-center/components/EvaluationPanel";
import { LiveMessagesFeed } from "@/src/command-center/components/LiveMessagesFeed";
import { ReasoningPanel } from "@/src/command-center/components/ReasoningPanel";
import { ToolExecutionPanel } from "@/src/command-center/components/ToolExecutionPanel";
import { ErrorState } from "@/src/components/states/error-state";
import { LoadingPanel } from "@/src/components/states/loading-panel";
import { EmptyState } from "@/src/components/ui/empty-state";
import {
  connectAgentTraceSocket,
  type AgentTraceSocketEvent,
} from "@/src/services/agent-trace.socket";

type ConnectionState = "connecting" | "live" | "disconnected";

export function CommandCenterPage() {
  const [events, setEvents] = useState<AgentTraceSocketEvent[]>([]);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const [connectionSeed, setConnectionSeed] = useState(0);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let socket: WebSocket | undefined;
    let isCancelled = false;

    const connect = () => {
      if (isCancelled) {
        return;
      }

      setConnectionState("connecting");
      socket = connectAgentTraceSocket({
        onOpen: () => setConnectionState("live"),
        onClose: () => {
          setConnectionState("disconnected");
          reconnectTimer = setTimeout(connect, 2000);
        },
        onError: () => setConnectionState("disconnected"),
        onEvent: (event) => {
          setEvents((current) => [event, ...current].slice(0, 150));
        },
      });
    };

    connect();

    return () => {
      isCancelled = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [connectionSeed]);

  const latestReasoning = useMemo(
    () => events.find((event) => event.step === "agent_routed"),
    [events],
  );
  const latestTool = useMemo(
    () => events.find((event) => event.step === "tool_called"),
    [events],
  );
  const latestEvaluation = useMemo(
    () => events.find((event) => event.step === "evaluation_completed"),
    [events],
  );
  const hasEvents = events.length > 0;

  function renderContent() {
    if (!hasEvents && connectionState === "connecting") {
      return (
        <LoadingPanel
          title="Conectando ao stream de agentes"
          description="Abrindo o canal em tempo real para receber traces, reasoning, consultas de conhecimento e resultados de avaliacao."
        />
      );
    }

    if (!hasEvents && connectionState === "disconnected") {
      return (
        <ErrorState
          title="Nao foi possivel conectar ao command center"
          description="O stream de traces nao respondeu agora. Verifique a API ou tente reconectar."
          action={
            <button
              type="button"
              onClick={() => setConnectionSeed((current) => current + 1)}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
                            Tentar novamente
            </button>
          }
        />
      );
    }

    if (!hasEvents) {
      return (
        <EmptyState
          title="Ainda nao ha traces suficientes para exibir"
          description="Assim que novas mensagens entrarem no orchestrator, voce vera a timeline, o reasoning e as chamadas de ferramenta em tempo real."
        />
      );
    }

    return (
      <>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">

          <AgentTraceViewer events={events} />

          <LiveMessagesFeed events={events} />

        </div>

        <div className="grid gap-6 xl:grid-cols-3">

          <ReasoningPanel event={latestReasoning} />

          <ToolExecutionPanel event={latestTool} />

          <EvaluationPanel event={latestEvaluation} />

        </div>

      </>
    );
  }

  return (
    <div className="space-y-8">

      <section className="rounded-[32px] border border-slate-200/80 bg-white/80 p-6 shadow-[0_36px_120px_-72px_rgba(15,23,42,0.45)] backdrop-blur">

        <div className="flex flex-wrap items-center justify-between gap-4">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-600">
              Runtime control
            </p>

            <h1 className="text-3xl font-semibold text-slate-950">
              Agent execution in real time
            </h1>

            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Acompanhe mensagens recebidas, roteamento, consultas de
              conhecimento, chamadas de ferramenta e avaliacao final enquanto o
              orchestrator publica traces estruturados.
            </p>

          </div>

          <span
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] ${
              connectionState === "live"
                ? "bg-emerald-100 text-emerald-700"
                : connectionState === "connecting"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-700"
            }`}
          >

            {connectionState === "live"
              ? "Live"
              : connectionState === "connecting"
                ? "Connecting"
                : "Disconnected"}

          </span>

        </div>

      </section>
            {renderContent()}

    </div>
  );
}
