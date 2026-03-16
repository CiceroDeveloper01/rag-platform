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

  return (
    <aside className="hidden w-[340px] shrink-0 border-r border-white/50 bg-white/72 px-7 py-8 backdrop-blur xl:block">

      <div className="space-y-8">

        <div className="space-y-4">

          <div className="flex flex-wrap items-center gap-2">

            <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-800">
                            Monorepo
            </div>

            <div className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-800">
                            SaaS UI
            </div>

          </div>

          <div>

            <h1 className="font-[family:var(--font-heading)] text-2xl font-semibold tracking-tight text-slate-950">
                            RAG Platform
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
                            Frontend de operacao do backend RAG em

              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-[family:var(--font-mono)] text-xs">
                                apps/web
              </code>
                            .
            </p>

          </div>

        </div>

        <nav className="space-y-2">

          {navigationItems.map((item) => {
            const isActive = isNavigationItemActive(pathname, item);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-2xl border px-4 py-3 transition ${
                  isActive
                    ? "border-sky-300 bg-sky-50 text-sky-950 shadow-[0_12px_30px_rgba(14,165,233,0.12)]"
                    : "border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                                <div className="font-medium">{item.label}</div>

                <div className="mt-1 text-sm text-slate-500">
                                    {item.description}

                </div>

              </Link>
            );
          })}

        </nav>

        <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(240,249,255,0.9))] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">

          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Stack
          </div>

          <div className="mt-4 grid gap-3 text-sm text-slate-600">

            <div className="rounded-2xl bg-slate-950 px-4 py-3 text-slate-100">
                            Next.js App Router + TypeScript
            </div>

            <div className="rounded-2xl bg-slate-100 px-4 py-3">
                            Tailwind CSS + componentizacao por feature

            </div>

            <div className="rounded-2xl bg-slate-100 px-4 py-3">
                            Integracao com NestJS via services de dominio

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
                        Cookies e estado no client protegem as rotas privadas e deixam a
                        base pronta para integracao real com backend.
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
