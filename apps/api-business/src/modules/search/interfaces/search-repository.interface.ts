import { SearchResult } from './search-result.interface';

export interface SearchDocumentsPayload {
  tenantId: string;
  embedding: number[];
  limit: number;
}

export interface SearchRepositoryInterface {
  searchSimilarDocuments(
    payload: SearchDocumentsPayload,
  ): Promise<SearchResult[]>;
}

export const SEARCH_REPOSITORY = Symbol('SEARCH_REPOSITORY');
