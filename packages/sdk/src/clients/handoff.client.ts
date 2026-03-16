import { HandoffRequest } from "@rag-platform/contracts";
import { InternalApiClient } from "../api/internal-api.client";

export class HandoffClient {
  constructor(
    private readonly apiClient: InternalApiClient,
    private readonly path = "/handoff",
  ) {}

  handoff<TResponse = unknown>(payload: HandoffRequest): Promise<TResponse> {
    return this.apiClient.post<HandoffRequest, TResponse>(this.path, payload);
  }
}
