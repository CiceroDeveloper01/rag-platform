import {
  DocumentsRegisterRequest,
  DocumentsRegisterResponse,
} from "@rag-platform/contracts";
import { InternalApiClient } from "../api/internal-api.client";
import { DocumentsClient } from "../clients/documents.client";

export class DocumentsInternalClient {
  private readonly client: DocumentsClient;

  constructor(apiClient: InternalApiClient, path = "/documents/register") {
    this.client = new DocumentsClient(apiClient, path);
  }

  registerDocument(
    payload: DocumentsRegisterRequest,
  ): Promise<DocumentsRegisterResponse> {
    return this.client.registerDocument<DocumentsRegisterResponse>(payload);
  }
}
