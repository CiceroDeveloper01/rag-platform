export function generateCorrelationId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `corr-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function getCorrelationId(currentCorrelationId?: string | null): string {
  return currentCorrelationId && currentCorrelationId.trim().length > 0
    ? currentCorrelationId
    : generateCorrelationId();
}
