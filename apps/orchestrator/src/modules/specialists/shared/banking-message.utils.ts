export function extractCurrencyAmount(text: string): number | null {
  const normalized = text
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .match(/(\d+(?:\.\d{1,2})?)/);

  if (!normalized) {
    return null;
  }

  const value = Number(normalized[1]);
  return Number.isFinite(value) ? value : null;
}

export function extractInstallments(text: string): number | null {
  const match = text.match(/(\d{1,2})\s*(x|parcelas?)/i);
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function hasConfirmationIntent(text: string): boolean {
  const normalized = text.toLowerCase();
  return ["confirmo", "confirmar", "pode bloquear", "autorizo", "sim, bloquear", "yes"].some((keyword) =>
    normalized.includes(keyword),
  );
}

export function summarizeContent(content: string, maxLength = 220): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}
