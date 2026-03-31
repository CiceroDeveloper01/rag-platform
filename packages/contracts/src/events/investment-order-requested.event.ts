export interface InvestmentOrderRequestedEvent {
  orderId: string;
  customerId: string;
  tenantId: string;
  productId: string;
  amount: number;
  requestedAt: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}
