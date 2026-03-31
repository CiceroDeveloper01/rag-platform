export interface MemoryEnrichmentRequestedEvent {
  enrichmentId: string;
  conversationId: string;
  tenantId: string;
  requestedAt: string;
  userId?: string;
  sourceMessageId?: string;
  enrichmentType?: string;
  metadata?: Record<string, unknown>;
}
