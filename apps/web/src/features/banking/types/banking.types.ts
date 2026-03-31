export type BankingDataSource = "api" | "mock";

export interface BankingResource<T> {
  data: T;
  source: BankingDataSource;
}

export interface CustomerProfile {
  id: string;
  fullName: string;
  email: string;
  segment: string;
  relationshipStatus: string;
}

export interface CustomerSummary {
  id: string;
  fullName: string;
  activeProducts: number;
  totalAccounts: number;
  hasCreditCard: boolean;
  hasInvestments: boolean;
}

export interface Card {
  id: string;
  brand: string;
  last4: string;
  status: string;
  holderName: string;
}

export interface CardLimit {
  cardId: string;
  totalLimit: number;
  availableLimit: number;
  usedLimit: number;
}

export interface CardInvoice {
  cardId: string;
  dueDate: string;
  amount: number;
  minimumPayment: number;
}

export interface CardAction {
  cardId: string;
  action: string;
  status: string;
  message: string;
}

export interface CardsWorkspace {
  cards: Card[];
  selectedCard: Card;
  limit: CardLimit;
  invoice: CardInvoice;
}

export interface InvestmentProduct {
  id: string;
  name: string;
  type: string;
  minimumAmount: number;
  annualRate: number;
  liquidity: string;
  maturityDays: number;
}

export interface InvestmentPosition {
  productId: string;
  productName: string;
  investedAmount: number;
}

export interface InvestmentPortfolio {
  customerId: string;
  positions: InvestmentPosition[];
  totalInvestedAmount: number;
}

export interface InvestmentSimulation {
  investedAmount: number;
  productType: string;
  projectedAmount: number;
  annualRate: number;
  periodInDays: number;
}

export interface CreditLimit {
  totalLimit: number;
  availableLimit: number;
  preApproved: boolean;
}

export interface CreditContract {
  contractId: string;
  productName: string;
  outstandingBalance: number;
  nextDueDate: string;
  status: string;
}

export interface CreditSimulation {
  requestedAmount: number;
  installmentCount: number;
  monthlyInstallment: number;
  estimatedRate: number;
  totalAmount: number;
}
