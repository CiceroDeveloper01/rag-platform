"use client";

import { useState } from "react";
import { SectionCard } from "@/src/components/ui/section-card";
import { chatApiService } from "@/src/features/chat/services/chat-api.service";

export function ContextualAssistantPanel({
  title,
  contextLabel,
  contextSummary,
  suggestions,
}: {
  title: string;
  contextLabel: string;
  contextSummary: string;
  suggestions: string[];
}) {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(question: string) {
    const normalizedQuestion = question.trim();
    if (!normalizedQuestion) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setLastQuestion(normalizedQuestion);

    try {
      const response = await chatApiService.askQuestion({
        question: `Contexto da tela: ${contextLabel}. Resumo atual: ${contextSummary}. Pedido do usuario: ${normalizedQuestion}`,
        topK: 4,
        maxContextCharacters: 4000,
      });

      setAnswer(response.answer);
      setPrompt("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel consultar o assistente agora.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SectionCard className="space-y-5 border-slate-200 bg-[linear-gradient(180deg,rgba(8,32,50,0.98),rgba(10,54,73,0.94))] text-white">
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
          Assistente inteligente
        </div>
        <h2 className="font-[family:var(--font-heading)] text-2xl font-semibold">
          {title}
        </h2>
        <p className="text-sm leading-7 text-white/75">
          O assistente usa o contexto da tela atual para responder com mais
          precisao, sem virar o centro da experiencia.
        </p>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/6 p-4 text-sm text-white/80">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
          Contexto atual
        </div>
        <p className="mt-2 leading-7">{contextSummary}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => {
              setPrompt(suggestion);
              void handleSubmit(suggestion);
            }}
            className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-left text-xs font-medium text-white/80 transition hover:bg-white/14"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={4}
          placeholder={`Pergunte algo sobre ${contextLabel.toLowerCase()}...`}
          className="w-full rounded-[24px] border border-white/12 bg-[#031521] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
        />
        <button
          type="button"
          onClick={() => void handleSubmit(prompt)}
          disabled={isLoading}
          className="inline-flex h-11 items-center justify-center rounded-[16px] bg-teal-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:bg-teal-200"
        >
          {isLoading ? "Consultando..." : "Consultar assistente"}
        </button>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {answer ? (
        <div className="space-y-3 rounded-[24px] border border-white/10 bg-white/6 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
            Ultima resposta
          </div>
          <p className="text-sm font-medium text-white/85">{lastQuestion}</p>
          <p className="text-sm leading-7 text-white/78">{answer}</p>
        </div>
      ) : null}
    </SectionCard>
  );
}
