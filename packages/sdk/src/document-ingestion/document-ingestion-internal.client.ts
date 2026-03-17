import { InternalApiClient } from "../api/internal-api.client";
import {
  CompleteDocumentIngestionRequest,
  DocumentIngestionClient,
  FailDocumentIngestionRequest,
  RequestDocumentIngestionRequest,
  UpdateDocumentIngestionStatusRequest,
} from "../clients/document-ingestion.client";

export class DocumentIngestionInternalClient {
  private readonly client: DocumentIngestionClient;

  constructor(
    apiClient: InternalApiClient,
    requestPath = "/ingestion/request",
    completePath = "/ingestion/complete",
    failPath = "/ingestion/fail",
    statusPath = "/ingestion/status",
  ) {
    this.client = new DocumentIngestionClient(
      apiClient,
      requestPath,
      completePath,
      failPath,
      statusPath,
    );
  }

  requestIngestion<TResponse = unknown>(
    payload: RequestDocumentIngestionRequest,
  ): Promise<TResponse> {
    return this.client.request<TResponse>(payload);
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

  updateIngestionStatus<TResponse = unknown>(
    payload: UpdateDocumentIngestionStatusRequest,
  ): Promise<TResponse> {
    return this.client.updateStatus<TResponse>(payload);
  }
}
