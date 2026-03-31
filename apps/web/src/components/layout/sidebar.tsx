"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuth } from "@/src/lib/auth/auth-provider";
import { isNavigationItemActive, navigationItems } from "./navigation";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.replace("/login");
    router.refresh();
  }

  const bankingItems = navigationItems.filter((item) => item.group === "banking");
  const operationsItems = navigationItems.filter(
    (item) => item.group === "operations",
  );
  const runtimeItems = navigationItems.filter((item) => item.group === "runtime");

  return (
    <aside className="hidden w-[350px] shrink-0 border-r border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(241,245,249,0.88))] px-7 py-8 backdrop-blur xl:block">

      <div className="space-y-8">

        <div className="space-y-4">

          <div className="flex flex-wrap items-center gap-2">

            <div className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800">
                            Banking
            </div>

            <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-800">
                            Platform Ops
            </div>

          </div>

          <div>

            <h1 className="font-[family:var(--font-heading)] text-2xl font-semibold tracking-tight text-slate-950">
                            Meridian Digital
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
                            Portal da Intelligent Automation Platform com modulos
                            bancarios, assistente contextual e monitorias operacionais em

              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-[family:var(--font-mono)] text-xs">
                                apps/web
              </code>
                            .
            </p>

          </div>

        </div>

        <nav className="space-y-6">
          <div className="space-y-2">
            <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Banking
            </div>
            {bankingItems.map((item) => {
              const isActive = isNavigationItemActive(pathname, item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-2xl border px-4 py-3 transition ${
                    isActive
                      ? "border-teal-300 bg-teal-50 text-teal-950 shadow-[0_12px_30px_rgba(13,148,136,0.12)]"
                      : "border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white/70"
                  }`}
                >
                  <div className="font-medium">{item.label}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {item.description}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Operations
            </div>
            {operationsItems.map((item) => {
            const isActive = isNavigationItemActive(pathname, item);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-2xl border px-4 py-3 transition ${
                  isActive
                    ? "border-sky-300 bg-sky-50 text-sky-950 shadow-[0_12px_30px_rgba(14,165,233,0.12)]"
                    : "border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white/70"
                }`}
              >
                <div className="font-medium">{item.label}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {item.description}
                </div>
              </Link>
            );
          })}
          </div>

          <div className="space-y-2">
            <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Runtime
            </div>
            {runtimeItems.map((item) => {
              const isActive = isNavigationItemActive(pathname, item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-2xl border px-4 py-3 transition ${
                    isActive
                      ? "border-violet-300 bg-violet-50 text-violet-950 shadow-[0_12px_30px_rgba(139,92,246,0.12)]"
                      : "border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white/70"
                  }`}
                >
                  <div className="font-medium">{item.label}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {item.description}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(145deg,rgba(6,78,59,0.96),rgba(8,47,73,0.94))] p-5 text-white shadow-[0_16px_40px_rgba(15,23,42,0.05)]">

          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
                        Platform snapshot
          </div>

          <div className="mt-4 grid gap-3 text-sm text-white/80">

            <div className="rounded-2xl bg-white/10 px-4 py-3">
                            Banking modules, omnichannel visibility e simulacao controlada
            </div>

            <div className="rounded-2xl bg-white/10 px-4 py-3">
                            Integracao com cards, credito, investimentos, cliente e sessoes reais
            </div>

            <div className="rounded-2xl bg-white/10 px-4 py-3">
                            Monitorias, handoffs e runtime operacional como vitrine tecnica
            </div>

          </div>

        </div>

        <div className="rounded-[28px] border border-slate-200/80 bg-white/92 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">

          <div className="flex items-center justify-between gap-4">

            <div>

              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                                Session
              </div>

              <div className="mt-2 font-medium text-slate-950">

                {isAuthenticated ? user?.name : "Nao autenticado"}

              </div>

            </div>

            <div
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${isAuthenticated ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
            >
                            {isAuthenticated ? user?.role : "guest"}

            </div>

          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
                        Sessao no client, rotas privadas e UI modular deixam a base
                        pronta para evoluir como portal financeiro conectado aos backends.
          </p>

          <div className="mt-4">

            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-10 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-[16px] bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                                Fazer login
              </Link>
            )}

          </div>

        </div>

      </div>

    </aside>
  );
}
