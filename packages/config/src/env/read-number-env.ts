export function readNumberEnv(
  value: string | undefined,
  fallback: number,
): number {
  if (value == null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
