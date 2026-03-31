import { Injectable } from "@nestjs/common";
import { ApiBusinessBankingClient } from "../../integrations/api-business/api-business-banking.client";
import { Tool, ToolInput, ToolResult } from "../base/tool.interface";

@Injectable()
export class SimulateCreditToolService implements Tool {
  readonly name = "SimulateCredit";

  constructor(
    private readonly apiBusinessBankingClient: ApiBusinessBankingClient,
  ) {}

  async execute(input: ToolInput): Promise<ToolResult> {
    const requestedAmount =
      typeof input.payload.requestedAmount === "number"
        ? input.payload.requestedAmount
        : 0;
    const installmentCount =
      typeof input.payload.installmentCount === "number"
        ? input.payload.installmentCount
        : 0;

    if (requestedAmount <= 0 || installmentCount <= 0) {
      return {
        success: false,
        error: "invalid_credit_payload",
        metadata: {
          correlationId: input.correlationId,
          endpoint: "/banking/credit/simulate",
        },
      };
    }

    try {
      const simulation = await this.apiBusinessBankingClient.simulateCredit({
        requestedAmount,
        installmentCount,
        correlationId: input.correlationId,
        tenantId: input.tenantId,
      });

      return {
        success: true,
        data: simulation,
        metadata: {
          correlationId: input.correlationId,
          endpoint: "/banking/credit/simulate",
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "credit_simulation_failed",
        metadata: {
          correlationId: input.correlationId,
          endpoint: "/banking/credit/simulate",
        },
      };
    }
  }
}
