export function formatDate(
  value: Date | string | null | undefined,
  options?: {
    locale?: string;
    fallback?: string;
  },
): string {
  if (!value) {
    return options?.fallback ?? "n/a";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return options?.fallback ?? "n/a";
  }

  return date.toLocaleString(options?.locale ?? "en-US");
}
