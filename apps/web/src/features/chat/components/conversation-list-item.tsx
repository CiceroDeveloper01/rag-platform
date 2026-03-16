import { cn } from "@/src/lib/utils/cn";
import type { Conversation } from "../types/chat.types";
import { ConversationDeleteButton } from "./conversation-delete-button";

export function ConversationListItem({
  conversation,
  isActive,
  onClick,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "block w-full rounded-[22px] border px-4 py-4 text-left transition",
        isActive
          ? "border-sky-300 bg-sky-50 shadow-[0_14px_40px_rgba(14,165,233,0.10)]"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
      )}
    >

      <div className="flex items-start justify-between gap-3">

        <div className="font-medium text-slate-950">{conversation.title}</div>

        <ConversationDeleteButton onDelete={onDelete} />

      </div>

      <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                {new Date(conversation.updatedAt).toLocaleString("pt-BR")}

      </div>

      <div className="mt-2 text-sm text-slate-500">

        {
          conversation.messages.filter((message) => message.role !== "system")
            .length
        }
                mensagens
      </div>

    </button>
  );
}
