export const EMBEDDING_DIMENSIONS = 1536;

export function normalizeVector(values: number[]): number[] {
  const magnitude = Math.sqrt(
    values.reduce((sum, value) => sum + value * value, 0),
  );

  if (magnitude === 0) {
    return values;
  }

  return values.map((value) => Number((value / magnitude).toFixed(8)));
}

export function serializeVector(values: number[]): string {
  return `[${values.join(',')}]`;
}
