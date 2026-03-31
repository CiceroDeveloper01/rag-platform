export const BANKING_ROUTING_KEYWORDS = {
  card: [
    "cartao",
    "cartão",
    "card",
    "tarjeta",
    "fatura",
    "invoice",
    "limite",
    "límite",
    "lost card",
    "block card",
    "bloquear",
    "tarjeta bloqueada",
  ],
  investment: [
    "investir",
    "invest",
    "investment",
    "inversion",
    "inversión",
    "cdb",
    "tesouro",
    "treasury",
    "lci",
    "lca",
    "rendimento",
    "yield",
  ],
  credit: [
    "emprestimo",
    "empréstimo",
    "loan",
    "prestamo",
    "préstamo",
    "financiamento",
    "credit simulation",
    "simulacao",
    "simulação",
    "simulacion",
    "simulación",
  ],
  debt: [
    "divida",
    "dívida",
    "debt",
    "deuda",
    "renegociacao",
    "renegociação",
    "negotiation",
    "refinanciacion",
    "refinanciación",
  ],
  account: [
    "conta",
    "account",
    "cuenta",
    "saldo",
    "balance",
    "extrato",
    "statement",
    "agencia",
    "agência",
    "branch",
    "profile",
    "dados cadastrais",
  ],
} as const;

export function normalizeBankingText(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, " ");
}

export function containsAnyKeyword(
  text: string,
  keywords: readonly string[],
): boolean {
  const normalizedText = normalizeBankingText(text);

  return keywords.some((keyword) =>
    normalizedText.includes(normalizeBankingText(keyword)),
  );
}

export function hasAnyBankingRoutingKeyword(text: string): boolean {
  return Object.values(BANKING_ROUTING_KEYWORDS).some((keywords) =>
    containsAnyKeyword(text, keywords),
  );
}
