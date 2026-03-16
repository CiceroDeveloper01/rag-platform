"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/src/components/states/error-state";
import { LoadingState } from "@/src/components/ui/loading-state";
import { SectionCard } from "@/src/components/ui/section-card";
import { StatusPill } from "@/src/components/ui/status-pill";
import { useAuth } from "@/src/lib/auth/auth-provider";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("demo@ragplatform.dev");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      const returnTo =
        typeof window !== "undefined"
          ? (new URLSearchParams(window.location.search).get("returnTo") ??
            "/dashboard")
          : "/dashboard";
      router.replace(returnTo);
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel autenticar agora.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SectionCard className="mx-auto max-w-xl space-y-6">

      <div className="space-y-3">
                <StatusPill tone="info">Demo access</StatusPill>

        <h2 className="font-[family:var(--font-heading)] text-3xl font-semibold text-slate-950">
                    Entre para acessar a workspace privada
        </h2>

        <p className="text-sm leading-7 text-slate-600">
                    Esta autenticacao usa sessao no frontend com cookie para proteger
                    rotas e preparar a evolucao para refresh token e integracao real com
                    backend.
        </p>

      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        <label className="space-y-2">

          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Email
          </span>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />

        </label>

        <label className="space-y-2">

          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Password
          </span>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />

        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 w-full items-center justify-center rounded-[18px] bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
                    {isSubmitting ? "Entrando..." : "Entrar na plataforma"}

        </button>

      </form>
            {isSubmitting ? <LoadingState label="Validando sessao" /> : null}

      {error ? <ErrorState title="Falha no login" description={error} /> : null}

      <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                Credenciais da demo: <strong>demo@ragplatform.dev</strong> /
                <strong>demo123</strong>

      </div>

    </SectionCard>
  );
}
