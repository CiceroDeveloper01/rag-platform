export interface CreditProposalRequestedEvent {
  proposalId: string;
  customerId: string;
  tenantId: string;
  requestedAmount: number;
  requestedAt: string;
  installmentCount?: number;
  productType?: string;
  metadata?: Record<string, unknown>;
}
