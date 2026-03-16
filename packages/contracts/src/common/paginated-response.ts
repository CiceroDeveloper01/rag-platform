import type { PaginationMeta } from "@rag-platform/types";

export interface PaginatedResponse<TItem> {
  items: TItem[];
  pagination: PaginationMeta;
}
