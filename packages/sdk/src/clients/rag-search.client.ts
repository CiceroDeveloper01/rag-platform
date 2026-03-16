import { RagQueryRequest, RagQueryResponse } from "@rag-platform/contracts";
import { InternalApiClient } from "../api/internal-api.client";
import type { SearchApiRequest, SearchApiResponse } from "./interfaces";

export class RagSearchClient {
  constructor(
    private readonly apiClient: InternalApiClient,
    private readonly path = "/search",
  ) {}

  async query(payload: RagQueryRequest): Promise<RagQueryResponse> {
    const response = await this.apiClient.post<
      SearchApiRequest,
      SearchApiResponse
    >(this.path, {
      tenantId: payload.tenantId,
      query: payload.question,
      top_k: payload.topK,
    });

    return {
      question: payload.question,
      contexts: response.results,
    };
  }
}
