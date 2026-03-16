export interface UploadDocumentResponse {
  sourceId: number;
  filename: string;
  uploadedAt: string;
  chunksGenerated: number;
  documentsProcessed: number;
}

export interface DocumentListItem {
  id: number;
  filename: string;
  type: string;
  createdAt: string;
  status: "processed" | "pending" | "failed";
  chunksGenerated?: number;
  documentsProcessed?: number;
  chunksCount?: number;
}

export interface DocumentsListResponse {
  items: DocumentListItem[];
  source: "api" | "local";
  unavailableReason?: string;
}

export interface DocumentFiltersState {
  search: string;
  type: "all" | "pdf" | "txt" | "other";
  sort: "newest" | "oldest";
}

export interface UpdateDocumentPayload {
  filename?: string;
  type?: string;
}
