export interface DocumentIngestionRequestedEvent {
  sourceId: number;
  tenantId: string;
  filename: string;
  mimeType: string;
  storageKey: string;
  storageUrl: string;
  fileContentBase64: string;
  chunkSize?: number;
  chunkOverlap?: number;
  metadata?: Record<string, string>;
  uploadedAt: string;
}
