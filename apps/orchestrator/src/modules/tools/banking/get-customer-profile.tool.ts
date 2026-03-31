import { Injectable } from "@nestjs/common";
import { Tool, ToolInput, ToolResult } from "../base/tool.interface";
import { ApiBusinessBankingClient } from "../../integrations/api-business/api-business-banking.client";

@Injectable()
export class GetCustomerProfileToolService implements Tool {
  readonly name = "GetCustomerProfile";

  constructor(
    private readonly apiBusinessBankingClient: ApiBusinessBankingClient,
  ) {}

  async execute(input: ToolInput): Promise<ToolResult> {
    try {
      const profile = await this.apiBusinessBankingClient.getCustomerProfile({
        correlationId: input.correlationId,
        tenantId: input.tenantId,
      });

      return {
        success: true,
        data: profile,
        metadata: {
          correlationId: input.correlationId,
          endpoint: "/banking/customer/profile",
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "customer_profile_request_failed",
        metadata: {
          correlationId: input.correlationId,
          endpoint: "/banking/customer/profile",
        },
      };
    }
  }
}
