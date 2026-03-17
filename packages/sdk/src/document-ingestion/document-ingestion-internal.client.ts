import { InternalApiClient } from "../api/internal-api.client";
import {
  CompleteDocumentIngestionRequest,
  DocumentIngestionClient,
  FailDocumentIngestionRequest,
} from "../clients/document-ingestion.client";

export class DocumentIngestionInternalClient {
  private readonly client: DocumentIngestionClient;

  constructor(
    apiClient: InternalApiClient,
    completePath = "/ingestion/complete",
    failPath = "/ingestion/fail",
  ) {
    this.client = new DocumentIngestionClient(apiClient, completePath, failPath);
  }

  completeIngestion<TResponse = unknown>(
    payload: CompleteDocumentIngestionRequest,
  ): Promise<TResponse> {
    return this.client.complete<TResponse>(payload);
  }

  failIngestion<TResponse = unknown>(
    payload: FailDocumentIngestionRequest,
  ): Promise<TResponse> {
    return this.client.fail<TResponse>(payload);
  }
}
