export interface DocumentIngestionRequestedEvent {
  sourceId: number;
  tenantId: string;
  sourceChannel?: string;
  conversationId?: string;
  filename: string;
  mimeType: string;
  storageKey: string;
  storageUrl: string;
  fileContentBase64: string;
  chunkSize?: number;
  chunkOverlap?: number;
  metadata?: Record<string, string>;
  requestedAt?: string;
  uploadedAt: string;
}
