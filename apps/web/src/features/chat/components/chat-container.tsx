"use client";

import type { ChatMessageModel } from "../types/chat.types";
import { ChatMessageList } from "./chat-message-list";

export function ChatContainer({
  messages,
  isStreaming,
}: {
  messages: ChatMessageModel[];
  isStreaming: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] shadow-[0_24px_60px_rgba(15,23,42,0.08)]">

      <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-5">

        <div>

          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Conversation
          </div>

          <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                        Respostas do backend RAG
          </h2>

        </div>

        <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                    {isStreaming ? "Streaming" : "Idle"}

        </div>

      </div>

      <ChatMessageList messages={messages} isStreaming={isStreaming} />

    </div>
  );
}
