export interface HandoffRequestedEvent {
  handoffId: string;
  conversationId: string;
  tenantId: string;
  reason: string;
  requestedAt: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}
