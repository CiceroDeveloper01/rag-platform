import { SectionCard } from "@/src/components/ui/section-card";
import { StatusPill } from "@/src/components/ui/status-pill";
import type { ChatMessageModel } from "../types/chat.types";

export function ChatHistoryPanel({
  lastAssistantMessage,
}: {
  lastAssistantMessage?: ChatMessageModel | null;
}) {
  return (
    <SectionCard className="space-y-4">

      <div className="flex items-center justify-between gap-4">

        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Last answer
        </div>

        <StatusPill
          tone={lastAssistantMessage?.status === "error" ? "error" : "neutral"}
        >
                    {lastAssistantMessage?.status ?? "idle"}

        </StatusPill>

      </div>

      <p className="text-sm leading-7 text-slate-600">

        {lastAssistantMessage?.content
          ? `${lastAssistantMessage.content.slice(0, 220)}${lastAssistantMessage.content.length > 220 ? "..." : ""}`
          : "Nenhuma resposta do assistente ainda."}

      </p>

      <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                Historico persistido localmente enquanto o backend ainda nao expoe a API
                completa de conversas.
      </div>

    </SectionCard>
  );
}
