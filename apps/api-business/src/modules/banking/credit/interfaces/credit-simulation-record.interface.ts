export interface CreditSimulationRecord {
  requestedAmount: number;
  installmentCount: number;
  monthlyInstallment: number;
  estimatedRate: number;
  totalAmount: number;
}
