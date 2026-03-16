import { DocumentsRegisterRequest } from "@rag-platform/contracts";
import { InternalApiClient } from "../api/internal-api.client";

export class DocumentsClient {
  constructor(
    private readonly apiClient: InternalApiClient,
    private readonly path = "/documents/register",
  ) {}

  registerDocument<TResponse = unknown>(
    payload: DocumentsRegisterRequest,
  ): Promise<TResponse> {
    return this.apiClient.post<DocumentsRegisterRequest, TResponse>(
      this.path,
      payload,
    );
  }
}
