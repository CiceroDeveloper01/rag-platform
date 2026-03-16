import type { PaginationMeta } from "@rag-platform/types";

export function buildPaginationMeta(
  total: number,
  limit: number,
  offset: number,
): PaginationMeta {
  return {
    total,
    limit,
    offset,
  };
}
