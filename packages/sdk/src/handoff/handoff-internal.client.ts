import {
  HandoffResponse,
  InternalHandoffRequest,
} from "@rag-platform/contracts";
import { InternalApiClient } from "../api/internal-api.client";

export class HandoffInternalClient {
  constructor(
    private readonly apiClient: InternalApiClient,
    private readonly path = "/handoff",
  ) {}

  createHandoff(payload: InternalHandoffRequest): Promise<HandoffResponse> {
    return this.apiClient.post<InternalHandoffRequest, HandoffResponse>(
      this.path,
      payload,
    );
  }
}
