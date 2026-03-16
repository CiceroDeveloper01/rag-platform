import { appLinks } from "@/src/lib/constants/app";

const actions = [
  {
    title: "Omnichannel Dashboard",
    href: "/dashboard/omnichannel",
    description:
      "Abrir a visao operacional de canais, requests, conectores e metricas.",
  },
  {
    title: "API Health",
    href: appLinks.apiHealth,
    description: "Abrir health check do backend.",
  },
  {
    title: "API Metrics",
    href: appLinks.apiMetrics,
    description: "Consultar o endpoint /metrics.",
  },
  {
    title: "Prometheus",
    href: appLinks.prometheus,
    description: "Acompanhar coleta e targets.",
  },
  {
    title: "Grafana",
    href: appLinks.grafana,
    description: "Abrir dashboards locais.",
  },
];

export function DashboardQuickActions() {
  return (
    <div className="grid gap-4 md:grid-cols-2">

      {actions.map((action) => (
        <a
          key={action.title}
          href={action.href}
          target={action.href.startsWith("http") ? "_blank" : undefined}
          rel={action.href.startsWith("http") ? "noreferrer" : undefined}
          className="rounded-[24px] border border-slate-200 bg-white/92 px-5 py-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
        >

          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Quick action
          </div>

          <div className="mt-2 font-[family:var(--font-heading)] text-xl font-semibold text-slate-950">
                        {action.title}

          </div>

          <p className="mt-2 text-sm leading-7 text-slate-600">
                        {action.description}

          </p>

        </a>
      ))}

    </div>
  );
}
