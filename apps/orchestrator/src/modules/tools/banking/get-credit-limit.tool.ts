import { Injectable } from "@nestjs/common";
import { ApiBusinessBankingClient } from "../../integrations/api-business/api-business-banking.client";
import { Tool, ToolInput, ToolResult } from "../base/tool.interface";

@Injectable()
export class GetCreditLimitToolService implements Tool {
  readonly name = "GetCreditLimit";

  constructor(
    private readonly apiBusinessBankingClient: ApiBusinessBankingClient,
  ) {}

  async execute(input: ToolInput): Promise<ToolResult> {
    try {
      const limit = await this.apiBusinessBankingClient.getCreditLimit({
        correlationId: input.correlationId,
        tenantId: input.tenantId,
      });

      return {
        success: true,
        data: limit,
        metadata: {
          correlationId: input.correlationId,
          endpoint: "/banking/credit/limit",
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "credit_limit_request_failed",
        metadata: {
          correlationId: input.correlationId,
          endpoint: "/banking/credit/limit",
        },
      };
    }
  }
}
