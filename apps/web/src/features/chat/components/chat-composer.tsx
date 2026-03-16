"use client";

import { useState } from "react";
import type { SendMessageOptions } from "../types/chat.types";

export function ChatComposer({
  onSubmit,
  isSubmitting,
  onStop,
}: {
  onSubmit: (
    question: string,
    options?: SendMessageOptions,
  ) => Promise<void> | void;
  isSubmitting: boolean;
  onStop: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [topK, setTopK] = useState("5");
  const questionFieldId = "chat-question-input";
  const topKFieldId = "chat-top-k-input";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = question.trim();

    if (!trimmed) {
      return;
    }

    await onSubmit(trimmed, {
      topK: Number(topK),
    });
    setQuestion("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[30px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
    >

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">

        <label className="space-y-2">

          <span
            className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
            id={`${questionFieldId}-label`}
          >
                        Pergunta
          </span>

          <textarea
            id={questionFieldId}
            aria-labelledby={`${questionFieldId}-label`}
            rows={4}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Pergunte algo sobre os documentos ingeridos..."
            className="w-full resize-none rounded-[24px] border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm leading-7 text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />

        </label>

        <div className="flex flex-col gap-4 lg:w-[220px]">

          <label className="space-y-2">

            <span
              className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
              id={`${topKFieldId}-label`}
            >
                            top_k
            </span>

            <input
              id={topKFieldId}
              aria-labelledby={`${topKFieldId}-label`}
              inputMode="numeric"
              value={topK}
              onChange={(event) => setTopK(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />

          </label>

          <div className="mt-auto flex flex-col gap-3">

            <button
              type="submit"
              disabled={isSubmitting || !question.trim()}
              className="inline-flex h-12 items-center justify-center rounded-[18px] bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
                            {isSubmitting ? "Streaming..." : "Enviar pergunta"}

            </button>

            {isSubmitting ? (
              <button
                type="button"
                onClick={onStop}
                className="inline-flex h-12 items-center justify-center rounded-[18px] border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                                Interromper
              </button>
            ) : null}

          </div>

        </div>

      </div>

    </form>
  );
}
