export interface NavigationItem {
  href: string;
  label: string;
  description: string;
  group: "banking" | "operations" | "runtime";
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
    href: "/dashboard",
    label: "Dashboard",
    description: "Resumo financeiro e status da plataforma",
    group: "banking",
  },
  {
    href: "/cards",
    label: "Cartoes",
    description: "Status, limite, fatura e bloqueio",
    group: "banking",
  },
  {
    href: "/credit",
    label: "Credito",
    description: "Limite, contratos e simulacao",
    group: "banking",
  },
  {
    href: "/investments",
    label: "Investimentos",
    description: "Produtos, carteira e simulacao",
    group: "banking",
  },
  {
    href: "/customer",
    label: "Cliente",
    description: "Perfil e relacionamento",
    group: "banking",
  },
  {
    href: "/conversations",
    label: "Conversations",
    description: "Sessoes reais de Web, WhatsApp e Telegram",
    group: "operations",
  },
  {
    href: "/conversation-simulator",
    label: "Simulator",
    description: "Simulacao controlada de interacoes com IA",
    group: "operations",
  },
  {
    href: "/handoffs",
    label: "Handoffs",
    description: "Escalacoes humanas e filas de atendimento",
    group: "operations",
  },
  {
    href: "/observability",
    label: "Monitoring",
    description: "Health, latencia e operacao",
    group: "operations",
  },
  {
    href: "/assistant",
    label: "Assistant",
    description: "Assistente contextual do produto",
    group: "runtime",
  },
  {
    href: "/dashboard/omnichannel",
    label: "Omnichannel",
    description: "Metrica por canal e atividade da camada de entrada",
    group: "runtime",
  },
  {
    href: "/command-center",
    label: "Runtime",
    description: "Traces de agentes, tools e reasoning",
    group: "runtime",
  },
  {
    href: "/documents",
    label: "Documents",
    description: "Ingestao e base de conhecimento",
    group: "runtime",
  },
];
