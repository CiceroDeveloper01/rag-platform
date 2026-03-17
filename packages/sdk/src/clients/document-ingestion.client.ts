import { InternalApiClient } from "../api/internal-api.client";

export interface CompleteDocumentIngestionRequest {
  sourceId: number;
  tenantId: string;
  filename: string;
  mimeType: string;
  chunks: Array<{
    content: string;
    embedding: number[];
    metadata?: Record<string, unknown>;
  }>;
}

export interface FailDocumentIngestionRequest {
  sourceId: number;
  reason?: string;
}

export class DocumentIngestionClient {
  constructor(
    private readonly apiClient: InternalApiClient,
    private readonly completePath = "/ingestion/complete",
    private readonly failPath = "/ingestion/fail",
  ) {}

  complete<TResponse = unknown>(
    payload: CompleteDocumentIngestionRequest,
  ): Promise<TResponse> {
    return this.apiClient.post<CompleteDocumentIngestionRequest, TResponse>(
      this.completePath,
      payload,
    );
  }

  fail<TResponse = unknown>(
    payload: FailDocumentIngestionRequest,
  ): Promise<TResponse> {
    return this.apiClient.post<FailDocumentIngestionRequest, TResponse>(
      this.failPath,
      payload,
    );
  }
}
