"use client";

import { apiRequest, optionalApiRequest } from "@/src/lib/api/api-client";
import type {
  BankingResource,
  Card,
  CardAction,
  CardInvoice,
  CardLimit,
  CardsWorkspace,
  CreditContract,
  CreditLimit,
  CreditSimulation,
  CustomerProfile,
  CustomerSummary,
  InvestmentPortfolio,
  InvestmentProduct,
  InvestmentSimulation,
} from "../types/banking.types";

const mockProfile: CustomerProfile = {
  id: "cust-001",
  fullName: "Ada Lovelace",
  email: "ada@meridian.bank",
  segment: "Prime",
  relationshipStatus: "active",
};

const mockSummary: CustomerSummary = {
  id: "cust-001",
  fullName: "Ada Lovelace",
  activeProducts: 4,
  totalAccounts: 2,
  hasCreditCard: true,
  hasInvestments: true,
};

const mockCards: Card[] = [
  {
    id: "card-001",
    brand: "Visa Infinite",
    last4: "4432",
    status: "ACTIVE",
    holderName: "Ada Lovelace",
  },
  {
    id: "card-002",
    brand: "Mastercard Black",
    last4: "8841",
    status: "BLOCKED",
    holderName: "Ada Lovelace",
  },
];

const mockCardLimits: Record<string, CardLimit> = {
  "card-001": {
    cardId: "card-001",
    totalLimit: 25000,
    availableLimit: 18000,
    usedLimit: 7000,
  },
  "card-002": {
    cardId: "card-002",
    totalLimit: 18000,
    availableLimit: 18000,
    usedLimit: 0,
  },
};

const mockInvoices: Record<string, CardInvoice> = {
  "card-001": {
    cardId: "card-001",
    dueDate: "2026-04-10",
    amount: 1280.44,
    minimumPayment: 320.11,
  },
  "card-002": {
    cardId: "card-002",
    dueDate: "2026-04-15",
    amount: 0,
    minimumPayment: 0,
  },
};

const mockProducts: InvestmentProduct[] = [
  {
    id: "prod-cdb-001",
    name: "CDB Liquidez Diaria",
    type: "cdb",
    minimumAmount: 1000,
    annualRate: 0.118,
    liquidity: "D+0",
    maturityDays: 365,
  },
  {
    id: "prod-lci-001",
    name: "LCI 12 Meses",
    type: "lci",
    minimumAmount: 5000,
    annualRate: 0.104,
    liquidity: "No vencimento",
    maturityDays: 360,
  },
];

const mockPortfolio: InvestmentPortfolio = {
  customerId: "cust-001",
  positions: [
    {
      productId: "prod-cdb-001",
      productName: "CDB Liquidez Diaria",
      investedAmount: 15000,
    },
    {
      productId: "prod-lci-001",
      productName: "LCI 12 Meses",
      investedAmount: 7500,
    },
  ],
  totalInvestedAmount: 22500,
};

const mockCreditLimit: CreditLimit = {
  totalLimit: 30000,
  availableLimit: 18000,
  preApproved: true,
};

const mockContracts: CreditContract[] = [
  {
    contractId: "ctr-001",
    productName: "Personal Loan",
    outstandingBalance: 7450.9,
    nextDueDate: "2026-04-20",
    status: "active",
  },
];

async function resolveResource<T>(
  loader: () => Promise<T | null>,
  fallback: T,
): Promise<BankingResource<T>> {
  try {
    const response = await loader();
    if (response) {
      return {
        data: response,
        source: "api",
      };
    }
  } catch {
    // Banking pages should remain usable even when the current web boundary
    // is not yet proxying banking endpoints.
  }

  return {
    data: fallback,
    source: "mock",
  };
}

function buildInvestmentSimulation(
  amount: number,
  productType: string,
  periodInDays: number,
): InvestmentSimulation {
  const product =
    mockProducts.find((entry) => entry.type === productType) ?? mockProducts[0];

  return {
    investedAmount: amount,
    productType,
    projectedAmount: Number(
      (amount * (1 + product.annualRate * (periodInDays / 365))).toFixed(2),
    ),
    annualRate: product.annualRate,
    periodInDays,
  };
}

function buildCreditSimulation(
  requestedAmount: number,
  installmentCount: number,
): CreditSimulation {
  const estimatedRate = 0.021;
  const totalAmount = Number(
    (requestedAmount * (1 + estimatedRate * installmentCount)).toFixed(2),
  );

  return {
    requestedAmount,
    installmentCount,
    monthlyInstallment: Number((totalAmount / installmentCount).toFixed(2)),
    estimatedRate,
    totalAmount,
  };
}

export const bankingApiService = {
  getCustomerProfile() {
    return resolveResource(
      () => optionalApiRequest<CustomerProfile>("/banking/customer/profile"),
      mockProfile,
    );
  },

  getCustomerSummary() {
    return resolveResource(
      () => optionalApiRequest<CustomerSummary>("/banking/customer/summary"),
      mockSummary,
    );
  },

  getCards() {
    return resolveResource(
      () => optionalApiRequest<Card[]>("/banking/cards"),
      mockCards,
    );
  },

  getCardLimit(cardId: string) {
    return resolveResource(
      () => optionalApiRequest<CardLimit>(`/banking/cards/${cardId}/limit`),
      mockCardLimits[cardId] ?? mockCardLimits["card-001"],
    );
  },

  getCardInvoice(cardId: string) {
    return resolveResource(
      () => optionalApiRequest<CardInvoice>(`/banking/cards/${cardId}/invoice`),
      mockInvoices[cardId] ?? mockInvoices["card-001"],
    );
  },

  async getCardsWorkspace(selectedCardId?: string) {
    const cards = await this.getCards();
    const selectedCard =
      cards.data.find((card) => card.id === selectedCardId) ?? cards.data[0];

    const [limit, invoice] = await Promise.all([
      this.getCardLimit(selectedCard.id),
      this.getCardInvoice(selectedCard.id),
    ]);

    return {
      data: {
        cards: cards.data,
        selectedCard,
        limit: limit.data,
        invoice: invoice.data,
      } satisfies CardsWorkspace,
      source:
        cards.source === "api" && limit.source === "api" && invoice.source === "api"
          ? "api"
          : "mock",
    } satisfies BankingResource<CardsWorkspace>;
  },

  async blockCard(cardId: string) {
    try {
      return {
        data: await apiRequest<CardAction>(`/banking/cards/${cardId}/block`, {
          method: "POST",
          body: JSON.stringify({
            reason: "user_request",
          }),
        }),
        source: "api",
      } satisfies BankingResource<CardAction>;
    } catch {
      return {
        data: {
          cardId,
          action: "block",
          status: "completed",
          message: "Bloqueio processado em modo de demonstracao do frontend.",
        },
        source: "mock",
      } satisfies BankingResource<CardAction>;
    }
  },

  async unblockCard(cardId: string) {
    try {
      return {
        data: await apiRequest<CardAction>(`/banking/cards/${cardId}/unblock`, {
          method: "POST",
          body: JSON.stringify({
            reason: "user_request",
          }),
        }),
        source: "api",
      } satisfies BankingResource<CardAction>;
    } catch {
      return {
        data: {
          cardId,
          action: "unblock",
          status: "completed",
          message:
            "Desbloqueio processado em modo de demonstracao do frontend.",
        },
        source: "mock",
      } satisfies BankingResource<CardAction>;
    }
  },

  getInvestmentProducts() {
    return resolveResource(
      () => optionalApiRequest<InvestmentProduct[]>("/banking/investments/products"),
      mockProducts,
    );
  },

  getInvestmentPortfolio() {
    return resolveResource(
      () => optionalApiRequest<InvestmentPortfolio>("/banking/investments/portfolio"),
      mockPortfolio,
    );
  },

  async simulateInvestment(params: {
    amount: number;
    productType: string;
    periodInDays: number;
  }) {
    try {
      return {
        data: await apiRequest<InvestmentSimulation>(
          "/banking/investments/simulate",
          {
            method: "POST",
            body: JSON.stringify(params),
          },
        ),
        source: "api",
      } satisfies BankingResource<InvestmentSimulation>;
    } catch {
      return {
        data: buildInvestmentSimulation(
          params.amount,
          params.productType,
          params.periodInDays,
        ),
        source: "mock",
      } satisfies BankingResource<InvestmentSimulation>;
    }
  },

  getCreditLimit() {
    return resolveResource(
      () => optionalApiRequest<CreditLimit>("/banking/credit/limit"),
      mockCreditLimit,
    );
  },

  getCreditContracts() {
    return resolveResource(
      () => optionalApiRequest<CreditContract[]>("/banking/credit/contracts"),
      mockContracts,
    );
  },

  async simulateCredit(params: {
    requestedAmount: number;
    installmentCount: number;
  }) {
    try {
      return {
        data: await apiRequest<CreditSimulation>("/banking/credit/simulate", {
          method: "POST",
          body: JSON.stringify(params),
        }),
        source: "api",
      } satisfies BankingResource<CreditSimulation>;
    } catch {
      return {
        data: buildCreditSimulation(
          params.requestedAmount,
          params.installmentCount,
        ),
        source: "mock",
      } satisfies BankingResource<CreditSimulation>;
    }
  },
};
