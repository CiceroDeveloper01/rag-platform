"use client";

import { SectionCard } from "@/src/components/ui/section-card";
import { StatusPill } from "@/src/components/ui/status-pill";
import type { Conversation } from "../types/chat.types";
import { ConversationList } from "./conversation-list";

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
}) {
  return (
    <SectionCard className="space-y-5">

      <div className="space-y-3">
                <StatusPill tone="info">Persistent history</StatusPill>

        <div>

          <h2 className="font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                        Conversas
          </h2>

          <p className="mt-2 text-sm leading-7 text-slate-600">
                        Continue conversas anteriores, navegue pelo historico local e
                        prepare a UI para endpoints reais de conversacao.

          </p>

        </div>

      </div>

      <button
        type="button"
        onClick={onNewConversation}
        className="inline-flex h-11 w-full items-center justify-center rounded-[18px] bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
      >
                Nova conversa
      </button>

      <ConversationList
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        onDeleteConversation={onDeleteConversation}
      />

    </SectionCard>
  );
}
