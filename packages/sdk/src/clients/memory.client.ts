import {
  MemoryQueryRequest,
  MemoryQueryResponse,
  MemoryStoreRequest,
  MemoryStoreResponse,
} from "@rag-platform/contracts";
import { InternalApiClient } from "../api/internal-api.client";

export class MemoryClient {
  constructor(
    private readonly apiClient: InternalApiClient,
    private readonly storePath = "/memory/messages",
    private readonly queryPath = "/memory/context",
  ) {}

  storeMessage(payload: MemoryStoreRequest): Promise<MemoryStoreResponse> {
    return this.apiClient.post<MemoryStoreRequest, MemoryStoreResponse>(
      this.storePath,
      payload,
    );
  }

  queryContext(payload: MemoryQueryRequest): Promise<MemoryQueryResponse> {
    return this.apiClient.post<MemoryQueryRequest, MemoryQueryResponse>(
      this.queryPath,
      payload,
    );
  }
}
