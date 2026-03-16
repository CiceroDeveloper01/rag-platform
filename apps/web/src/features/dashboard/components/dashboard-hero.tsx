import { StatusPill } from "@/src/components/ui/status-pill";

export function DashboardHero() {
  return (
    <div className="rounded-[32px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(9,16,32,0.98),rgba(15,27,52,0.92))] p-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">

      <div className="flex flex-wrap items-start justify-between gap-6">

        <div className="space-y-4">
                    <StatusPill tone="info">Workspace overview</StatusPill>

          <div className="space-y-4">

            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                            Dashboard
            </div>

            <div className="space-y-3">

              <h1 className="max-w-4xl font-[family:var(--font-heading)] text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                Visao consolidada da plataforma RAG.

              </h1>

              <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                                Acompanhe saude do ambiente, documentos, conversas e links
                                operacionais em um painel mais forte para demo e portfólio.

              </p>

            </div>

          </div>

        </div>

        <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2">

          <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
                        Demo pronta para autenticacao, chat e ingestao.

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
                        Fallbacks elegantes enquanto endpoints evoluem.

          </div>

        </div>

      </div>

    </div>
  );
}
