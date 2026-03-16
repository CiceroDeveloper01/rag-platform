"use client";

import { LoadingPanel } from "@/src/components/states/loading-panel";
import { SectionCard } from "@/src/components/ui/section-card";
import { StatusPill } from "@/src/components/ui/status-pill";
import { useChat } from "../hooks/use-chat";
import { ChatComposer } from "./chat-composer";
import { ChatContainer } from "./chat-container";
import { ChatHistoryPanel } from "./chat-history-panel";
import { ConversationSidebar } from "./conversation-sidebar";

export function ChatExperience() {
  const {
    messages,
    conversations,
    activeConversationId,
    error,
    isPending,
    isLoadingHistory,
    sendQuestion,
    stopStreaming,
    startNewConversation,
    openConversation,
    deleteConversation,
    lastAssistantMessage,
  } = useChat();

  if (isLoadingHistory) {
    return (
      <LoadingPanel
        title="Carregando conversas"
        description="Restaurando o historico persistido do chat e preparando a workspace."
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.34fr_0.9fr_0.5fr]">

      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={openConversation}
        onNewConversation={startNewConversation}
        onDeleteConversation={deleteConversation}
      />

      <div className="space-y-5">

        <ChatContainer messages={messages} isStreaming={isPending} />

        <ChatComposer
          onSubmit={sendQuestion}
          isSubmitting={isPending}
          onStop={stopStreaming}
        />

      </div>

      <div className="space-y-5">

        <SectionCard className="space-y-4">
                    <StatusPill tone="info">Streaming ready</StatusPill>

          <h3 className="font-[family:var(--font-heading)] text-xl font-semibold text-slate-950">
                        Experiencia mais proxima de produto
          </h3>

          <p className="text-sm leading-7 text-slate-600">
                        O chat agora suporta SSE com fallback para JSON, historico local da
                        conversa e atualizacao progressiva da resposta enquanto o backend
                        gera tokens.
          </p>

        </SectionCard>

        <SectionCard className="space-y-4">

          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Session snapshot
          </div>

          <div className="grid gap-3 text-sm text-slate-600">

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            Resposta progressiva enquanto o backend transmite eventos SSE

            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            Tratamento consistente de erro e opcao de interrupcao do streaming

            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            Contexto recuperado exibido junto da mensagem do assistente

            </div>

          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {error}

            </div>
          ) : null}

        </SectionCard>

        <ChatHistoryPanel lastAssistantMessage={lastAssistantMessage} />

      </div>

    </div>
  );
}
