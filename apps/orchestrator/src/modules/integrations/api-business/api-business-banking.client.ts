import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InternalApiError } from "@rag-platform/shared";
import {
  AppLoggerService,
  MetricsService,
} from "@rag-platform/observability";
import { InternalApiClient } from "@rag-platform/sdk";
import {
  BankingCardActionResponse,
  BankingCardInvoiceResponse,
  BankingCardLimitResponse,
  BankingCardResponse,
  BankingCreditContractResponse,
  BankingCreditLimitResponse,
  BankingCreditSimulationResponse,
  BankingCustomerProfileResponse,
  BankingCustomerSummaryResponse,
  BankingInvestmentProductResponse,
  BankingInvestmentSimulationResponse,
} from "./api-business-banking.types";

@Injectable()
export class ApiBusinessBankingClient {
  constructor(
    private readonly apiClient: InternalApiClient,
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
    private readonly metricsService: MetricsService,
  ) {}

  async getCardInfo(params: {
    cardId?: string;
    correlationId: string;
    tenantId?: string;
  }): Promise<{
    card: BankingCardResponse;
    limit: BankingCardLimitResponse;
    invoice: BankingCardInvoiceResponse;
  }> {
    const resolvedCardId = params.cardId ?? (await this.resolveDefaultCardId(params));
    const [card, limit, invoice] = await Promise.all([
      this.get<BankingCardResponse>(
        `${this.cardsPath()}/${resolvedCardId}`,
        params,
      ),
      this.get<BankingCardLimitResponse>(
        `${this.cardsPath()}/${resolvedCardId}/limit`,
        params,
      ),
      this.get<BankingCardInvoiceResponse>(
        `${this.cardsPath()}/${resolvedCardId}/invoice`,
        params,
      ),
    ]);

    return { card, limit, invoice };
  }

  async blockCard(params: {
    cardId: string;
    correlationId: string;
    tenantId?: string;
    reason?: string;
    requestedBy?: string;
  }): Promise<BankingCardActionResponse> {
    return this.post<
      { reason?: string; requestedBy?: string },
      BankingCardActionResponse
    >(`${this.cardsPath()}/${params.cardId}/block`, {
      reason: params.reason,
      requestedBy: params.requestedBy,
    }, params);
  }

  async simulateInvestment(params: {
    amount: number;
    productType: string;
    periodInDays: number;
    correlationId: string;
    tenantId?: string;
  }): Promise<BankingInvestmentSimulationResponse> {
    return this.post(this.investmentsPath("/simulate"), {
      amount: params.amount,
      productType: params.productType,
      periodInDays: params.periodInDays,
    }, params);
  }

  async getInvestmentProducts(params: {
    correlationId: string;
    tenantId?: string;
  }): Promise<BankingInvestmentProductResponse[]> {
    return this.get(this.investmentsPath("/products"), params);
  }

  async getCustomerProfile(params: {
    correlationId: string;
    tenantId?: string;
  }): Promise<BankingCustomerProfileResponse> {
    return this.get(this.customerPath("/profile"), params);
  }

  async getCustomerSummary(params: {
    correlationId: string;
    tenantId?: string;
  }): Promise<BankingCustomerSummaryResponse> {
    return this.get(this.customerPath("/summary"), params);
  }

  async simulateCredit(params: {
    requestedAmount: number;
    installmentCount: number;
    correlationId: string;
    tenantId?: string;
  }): Promise<BankingCreditSimulationResponse> {
    return this.post(this.creditPath("/simulate"), {
      requestedAmount: params.requestedAmount,
      installmentCount: params.installmentCount,
    }, params);
  }

  async getCreditLimit(params: {
    correlationId: string;
    tenantId?: string;
  }): Promise<BankingCreditLimitResponse> {
    return this.get(this.creditPath("/limit"), params);
  }

  async getCreditContracts(params: {
    correlationId: string;
    tenantId?: string;
  }): Promise<BankingCreditContractResponse[]> {
    return this.get(this.creditPath("/contracts"), params);
  }

  private async resolveDefaultCardId(params: {
    correlationId: string;
    tenantId?: string;
  }): Promise<string> {
    const cards = await this.get<BankingCardResponse[]>(this.cardsPath(), params);
    const primaryCard = cards[0];

    if (!primaryCard) {
      throw new Error("no_card_available");
    }

    return primaryCard.id;
  }

  private async get<T>(
    endpoint: string,
    context: { correlationId: string; tenantId?: string },
  ): Promise<T> {
    return this.executeRequest(
      "GET",
      endpoint,
      () =>
        this.apiClient.get<T>(endpoint, {
          headers: this.buildHeaders(context),
        }),
      context,
    );
  }

  private async post<TRequest, TResponse>(
    endpoint: string,
    payload: TRequest,
    context: { correlationId: string; tenantId?: string },
  ): Promise<TResponse> {
    return this.executeRequest(
      "POST",
      endpoint,
      () =>
        this.apiClient.post<TRequest, TResponse>(endpoint, payload, {
          headers: this.buildHeaders(context),
        }),
      context,
    );
  }

  private async executeRequest<T>(
    method: "GET" | "POST",
    endpoint: string,
    operation: () => Promise<T>,
    context: { correlationId: string; tenantId?: string },
  ): Promise<T> {
    try {
      const response = await operation();
      this.metricsService.increment("api_business_banking_requests_total", {
        method,
        endpoint,
        status: "success",
      });
      this.logger.log(
        "api-business banking integration request succeeded",
        ApiBusinessBankingClient.name,
        {
          method,
          endpoint,
          correlationId: context.correlationId,
          tenantId: context.tenantId ?? "default-tenant",
        },
      );
      return response;
    } catch (error) {
      this.metricsService.increment("api_business_banking_requests_total", {
        method,
        endpoint,
        status: "failure",
      });
      this.logger.error(
        "api-business banking integration request failed",
        error instanceof Error ? error.stack : undefined,
        ApiBusinessBankingClient.name,
        {
          method,
          endpoint,
          correlationId: context.correlationId,
          tenantId: context.tenantId ?? "default-tenant",
          error:
            error instanceof InternalApiError
              ? error.statusCode
              : error instanceof Error
                ? error.message
                : "unknown_error",
        },
      );
      throw error;
    }
  }

  private buildHeaders(context: {
    correlationId: string;
    tenantId?: string;
  }): Record<string, string> {
    return {
      "x-correlation-id": context.correlationId,
      "x-tenant-id": context.tenantId ?? "default-tenant",
    };
  }

  private cardsPath(suffix = ""): string {
    return `${this.configService.getOrThrow<string>("internalApi.paths.bankingCards")}${suffix}`;
  }

  private investmentsPath(suffix = ""): string {
    return `${this.configService.getOrThrow<string>("internalApi.paths.bankingInvestments")}${suffix}`;
  }

  private customerPath(suffix = ""): string {
    return `${this.configService.getOrThrow<string>("internalApi.paths.bankingCustomer")}${suffix}`;
  }

  private creditPath(suffix = ""): string {
    return `${this.configService.getOrThrow<string>("internalApi.paths.bankingCredit")}${suffix}`;
  }
}
