export function truncateText(
  value: string,
  maxLength: number,
  suffix = "...",
): string {
  if (maxLength <= 0) {
    return "";
  }

  if (value.length <= maxLength) {
    return value;
  }

  const adjustedLength = Math.max(maxLength - suffix.length, 0);
  return `${value.slice(0, adjustedLength).trimEnd()}${suffix}`;
}
