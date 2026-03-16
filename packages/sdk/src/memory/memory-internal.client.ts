import {
  MemoryQueryRequest,
  MemoryQueryResponse,
  MemoryStoreRequest,
  MemoryStoreResponse,
} from "@rag-platform/contracts";
import { InternalApiClient } from "../api/internal-api.client";
import { MemoryClient } from "../clients/memory.client";

export class MemoryInternalClient {
  private readonly client: MemoryClient;

  constructor(
    apiClient: InternalApiClient,
    storePath = "/memory/messages",
    queryPath = "/memory/context",
  ) {
    this.client = new MemoryClient(apiClient, storePath, queryPath);
  }

  storeMessage(payload: MemoryStoreRequest): Promise<MemoryStoreResponse> {
    return this.client.storeMessage(payload);
  }

  queryContext(payload: MemoryQueryRequest): Promise<MemoryQueryResponse> {
    return this.client.queryContext(payload);
  }
}
