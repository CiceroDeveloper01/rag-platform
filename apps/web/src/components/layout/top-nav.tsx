"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/lib/auth/auth-provider";
import { isNavigationItemActive, navigationItems } from "./navigation";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();

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
    <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/76 px-4 py-4 backdrop-blur xl:hidden">

      <div className="mx-auto flex max-w-7xl flex-col gap-3">

        <div className="flex items-center justify-between">

          <div>

            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Meridian Digital
            </div>

            <div className="font-[family:var(--font-heading)] text-xl font-semibold tracking-tight text-slate-950">
                            Workspace
            </div>

          </div>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600"
            >
                            Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600"
            >
                            Login
            </Link>
          )}

        </div>

        <div className="space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {bankingItems.map((item) => {
              const isActive = isNavigationItemActive(pathname, item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border-teal-300 bg-teal-50 text-teal-900"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {operationsItems.map((item) => {
              const isActive = isNavigationItemActive(pathname, item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border-sky-300 bg-sky-50 text-sky-900"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {runtimeItems.map((item) => {
              const isActive = isNavigationItemActive(pathname, item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border-violet-300 bg-violet-50 text-violet-900"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
