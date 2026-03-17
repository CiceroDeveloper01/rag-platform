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

export interface UpdateDocumentIngestionStatusRequest {
  sourceId: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  currentStep?: "PARSING" | "CHUNKING" | "EMBEDDING" | "INDEXING";
  errorMessage?: string;
}

export interface RequestDocumentIngestionRequest {
  tenantId: string;
  sourceChannel?: string;
  conversationId?: string;
  filename: string;
  mimeType: string;
  fileContentBase64: string;
  chunkSize?: number;
  chunkOverlap?: number;
  metadata?: Record<string, string>;
}

export class DocumentIngestionClient {
  constructor(
    private readonly apiClient: InternalApiClient,
    private readonly requestPath = "/ingestion/request",
    private readonly completePath = "/ingestion/complete",
    private readonly failPath = "/ingestion/fail",
    private readonly statusPath = "/ingestion/status",
  ) {}

  request<TResponse = unknown>(
    payload: RequestDocumentIngestionRequest,
  ): Promise<TResponse> {
    return this.apiClient.post<RequestDocumentIngestionRequest, TResponse>(
      this.requestPath,
      payload,
    );
  }

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

  updateStatus<TResponse = unknown>(
    payload: UpdateDocumentIngestionStatusRequest,
  ): Promise<TResponse> {
    return this.apiClient.post<UpdateDocumentIngestionStatusRequest, TResponse>(
      this.statusPath,
      payload,
    );
  }
}
