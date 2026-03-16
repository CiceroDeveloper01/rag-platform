export function readBooleanEnv(
  value: string | undefined,
  fallback = false,
): boolean {
  if (value == null || value === "") {
    return fallback;
  }

  return value.toLowerCase() === "true";
}
