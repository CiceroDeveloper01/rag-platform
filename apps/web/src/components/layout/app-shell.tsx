import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-slate-950">

      <TopNav />

      <div className="mx-auto flex min-h-screen max-w-[1680px] xl:px-5 xl:py-5">

        <Sidebar />

        <main className="app-grid relative min-w-0 flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-8 xl:rounded-[36px] xl:border xl:border-white/60 xl:bg-white/68 xl:shadow-[0_32px_110px_rgba(15,23,42,0.10)]">

          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.10),transparent_60%)]" />

          <div className="relative mx-auto w-full max-w-7xl">{children}</div>

        </main>

      </div>

    </div>
  );
}
