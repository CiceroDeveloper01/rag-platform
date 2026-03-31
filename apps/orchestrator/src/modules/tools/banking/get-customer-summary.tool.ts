import { Injectable } from "@nestjs/common";
import { ApiBusinessBankingClient } from "../../integrations/api-business/api-business-banking.client";
import { Tool, ToolInput, ToolResult } from "../base/tool.interface";

@Injectable()
export class GetCustomerSummaryToolService implements Tool {
  readonly name = "GetCustomerSummary";

  constructor(
    private readonly apiBusinessBankingClient: ApiBusinessBankingClient,
  ) {}

  async execute(input: ToolInput): Promise<ToolResult> {
    try {
      const summary = await this.apiBusinessBankingClient.getCustomerSummary({
        correlationId: input.correlationId,
        tenantId: input.tenantId,
      });

      return {
        success: true,
        data: summary,
        metadata: {
          correlationId: input.correlationId,
          endpoint: "/banking/customer/summary",
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "customer_summary_request_failed",
        metadata: {
          correlationId: input.correlationId,
          endpoint: "/banking/customer/summary",
        },
      };
    }
  }
}
