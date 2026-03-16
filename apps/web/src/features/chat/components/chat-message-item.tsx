"use client";

import { StatusPill } from "@/src/components/ui/status-pill";
import { cn } from "@/src/lib/utils/cn";
import type { ChatMessageModel } from "../types/chat.types";

const toneByRole = {
  user: "info",
  assistant: "neutral",
  system: "warning",
} as const;

const labelByRole = {
  user: "User",
  assistant: "Assistant",
  system: "System",
} as const;

export function ChatMessageItem({ message }: { message: ChatMessageModel }) {
  const showsMissingContextNotice =
    message.role === "assistant" &&
    message.status !== "loading" &&
    Array.isArray(message.context) &&
    message.context.length === 0;

  return (
    <article
      className={cn(
        "rounded-[28px] border px-5 py-4 shadow-[0_16px_35px_rgba(15,23,42,0.04)]",
        message.role === "user"
          ? "ml-auto max-w-[88%] border-sky-200 bg-sky-50/90"
          : message.role === "system"
            ? "border-amber-200 bg-amber-50/70"
            : "mr-auto max-w-[92%] border-slate-200 bg-white",
      )}
    >

      <div className="flex flex-wrap items-center justify-between gap-3">

        <div className="flex items-center gap-3">

          <StatusPill tone={toneByRole[message.role]}>
                        {labelByRole[message.role]}

          </StatusPill>

          {message.status === "loading" ? (
            <StatusPill tone="info">Generating</StatusPill>
          ) : null}

          {message.status === "error" ? (
            <StatusPill tone="error">Error</StatusPill>
          ) : null}

        </div>

        <time className="text-xs text-slate-400">

          {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}

        </time>

      </div>

      <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">

        {message.content ||
          (message.status === "loading"
            ? "Construindo resposta..."
            : "Sem conteudo.")}

      </div>

      {showsMissingContextNotice ? (
        <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-amber-900">
                    Nenhum trecho relevante foi recuperado dos documentos para esta
                    pergunta. Vale tentar uma pergunta mais especifica ou ingerir arquivos
                    relacionados ao tema.
        </div>
      ) : null}

      {message.context && message.context.length > 0 ? (
        <div className="mt-5 space-y-3 rounded-[22px] border border-slate-200 bg-slate-50/90 p-4">

          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Retrieved context
          </div>

          <div className="grid gap-3">

            {message.context.map((chunk) => (
              <div
                key={chunk.id}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >

                <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                                    <span>Chunk #{chunk.id}</span>

                  <span>distance {chunk.distance.toFixed(3)}</span>

                </div>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {chunk.content}

                </p>

              </div>
            ))}

          </div>

        </div>
      ) : null}

    </article>
  );
}
