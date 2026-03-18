export interface UploadDocumentResponse {
  documentId: number;
  sourceId?: number;
  sourceChannel?: string | null;
  filename: string;
  uploadedAt: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  message: string;
}

export interface DocumentListItem {
  id: number;
  filename: string;
  sourceChannel?: string | null;
  type: string;
  createdAt: string;
  updatedAt?: string;
  status: "pending" | "processing" | "completed" | "failed";
  currentStep?: string | null;
  errorMessage?: string | null;
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
