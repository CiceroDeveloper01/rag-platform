import { RagQueryRequest, RagQueryResponse } from "@rag-platform/contracts";
import { InternalApiClient } from "../api/internal-api.client";
import { RagSearchClient } from "../clients/rag-search.client";

export class RagSearchInternalClient {
  private readonly client: RagSearchClient;

  constructor(apiClient: InternalApiClient, path = "/search") {
    this.client = new RagSearchClient(apiClient, path);
  }

  query(payload: RagQueryRequest): Promise<RagQueryResponse> {
    return this.client.query(payload);
  }
}
