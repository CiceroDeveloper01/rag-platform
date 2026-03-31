import { Injectable } from "@nestjs/common";
import { Tool, ToolInput, ToolResult } from "../base/tool.interface";
import { ApiBusinessBankingClient } from "../../integrations/api-business/api-business-banking.client";

@Injectable()
export class SimulateInvestmentToolService implements Tool {
  readonly name = "SimulateInvestment";

  constructor(
    private readonly apiBusinessBankingClient: ApiBusinessBankingClient,
  ) {}

  async execute(input: ToolInput): Promise<ToolResult> {
    const amount =
      typeof input.payload.amount === "number" ? input.payload.amount : 0;
    const productType =
      typeof input.payload.productType === "string"
        ? input.payload.productType
        : "cdb";
    const periodInDays =
      typeof input.payload.periodInDays === "number"
        ? input.payload.periodInDays
        : 365;

    if (amount <= 0) {
      return {
        success: false,
        error: "invalid_amount",
        metadata: {
          correlationId: input.correlationId,
          endpoint: "/banking/investments/simulate",
        },
      };
    }

    try {
      const simulation =
        await this.apiBusinessBankingClient.simulateInvestment({
          amount,
          productType,
          periodInDays,
          correlationId: input.correlationId,
          tenantId: input.tenantId,
        });

      return {
        success: true,
        data: {
          amount: simulation.investedAmount,
          annualRate: simulation.annualRate,
          projectedGross: simulation.projectedAmount,
          termMonths: Math.round(simulation.periodInDays / 30),
          periodInDays: simulation.periodInDays,
          productType: simulation.productType,
        },
        metadata: {
          correlationId: input.correlationId,
          endpoint: "/banking/investments/simulate",
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "investment_simulation_failed",
        metadata: {
          correlationId: input.correlationId,
          endpoint: "/banking/investments/simulate",
        },
      };
    }
  }
}
