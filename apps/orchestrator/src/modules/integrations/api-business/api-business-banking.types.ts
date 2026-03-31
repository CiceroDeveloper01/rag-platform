export interface BankingCardResponse {
  id: string;
  brand: string;
  last4: string;
  status: string;
  holderName: string;
}

export interface BankingCardLimitResponse {
  cardId: string;
  totalLimit: number;
  availableLimit: number;
  usedLimit: number;
}

export interface BankingCardInvoiceResponse {
  cardId: string;
  dueDate: string;
  amount: number;
  minimumPayment: number;
}

export interface BankingCardActionResponse {
  cardId: string;
  action: string;
  status: string;
  message: string;
}

export interface BankingInvestmentSimulationResponse {
  investedAmount: number;
  productType: string;
  projectedAmount: number;
  annualRate: number;
  periodInDays: number;
}

export interface BankingInvestmentProductResponse {
  id: string;
  name: string;
  type: string;
  minimumAmount: number;
  annualRate: number;
  liquidity: string;
  maturityDays: number;
}

export interface BankingCustomerProfileResponse {
  id: string;
  fullName: string;
  email: string;
  segment: string;
  relationshipStatus: string;
}

export interface BankingCustomerSummaryResponse {
  id: string;
  fullName: string;
  activeProducts: number;
  totalAccounts: number;
  hasCreditCard: boolean;
  hasInvestments: boolean;
}

export interface BankingCreditSimulationResponse {
  requestedAmount: number;
  installmentCount: number;
  monthlyInstallment: number;
  estimatedRate: number;
  totalAmount: number;
}

export interface BankingCreditLimitResponse {
  totalLimit: number;
  availableLimit: number;
  preApproved: boolean;
}

export interface BankingCreditContractResponse {
  contractId: string;
  productName: string;
  outstandingBalance: number;
  nextDueDate: string;
  status: string;
}
