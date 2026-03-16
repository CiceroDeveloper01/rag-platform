import type { RagQueryResponse } from '@rag-platform/contracts';

export interface SearchApiRequest {
  tenantId: string;
  query: string;
  top_k: number;
}

export interface SearchApiResponse {
  results: RagQueryResponse['contexts'];
}
