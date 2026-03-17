export interface NavigationItem {
  href: string;
  label: string;
  description: string;
}

export function isNavigationItemActive(pathname: string, item: NavigationItem) {
  if (item.href === "/") {
    return pathname === "/";
  }

  if (item.href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export const navigationItems: NavigationItem[] = [
  {
    href: "/",
    label: "Home",
    description: "Resumo da plataforma",
  },
  {
    href: "/login",
    label: "Login",
    description: "Acesso da demo",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Visao geral do ambiente",
  },
  {
    href: "/dashboard/cost-monitor",
    label: "Cost Monitor",
    description: "Consumo de IA por agente e tenant",
  },
  {
    href: "/dashboard/omnichannel",
    label: "Omnichannel",
    description: "Monitoramento de canais e execucoes",
  },
  {
    href: "/command-center",
    label: "Command Center",
    description: "Execucao de agentes em tempo real",
  },
  {
    href: "/simulation-lab",
    label: "Simulation Lab",
    description: "Teste de cenarios e validacao",
  },
  {
    href: "/chat",
    label: "Chat",
    description: "Perguntas e respostas RAG",
  },
  {
    href: "/documents",
    label: "Documents",
    description: "Upload e ingestao",
  },
  {
    href: "/documents/status",
    label: "Documents Status",
    description: "Fila e processamento assincrono",
  },
  {
    href: "/observability",
    label: "Observability",
    description: "Health e links operacionais",
  },
];
