import { Injectable } from "@nestjs/common";
import { Tool, ToolInput, ToolResult } from "../base/tool.interface";
import { ApiBusinessBankingClient } from "../../integrations/api-business/api-business-banking.client";

@Injectable()
export class GetCardInfoToolService implements Tool {
  readonly name = "GetCardInfo";

  constructor(
    private readonly apiBusinessBankingClient: ApiBusinessBankingClient,
  ) {}

  async execute(input: ToolInput): Promise<ToolResult> {
    try {
      const cardId =
        typeof input.payload.cardId === "string" ? input.payload.cardId : undefined;
      const result = await this.apiBusinessBankingClient.getCardInfo({
        cardId,
        correlationId: input.correlationId,
        tenantId: input.tenantId,
      });

      return {
        success: true,
        data: {
          cardId: result.card.id,
          status: result.card.status,
          limit: result.limit.availableLimit,
          totalLimit: result.limit.totalLimit,
          invoiceAmount: result.invoice.amount,
          invoiceDueDate: result.invoice.dueDate,
          minimumPayment: result.invoice.minimumPayment,
          brand: result.card.brand,
          last4: result.card.last4,
        },
        metadata: {
          correlationId: input.correlationId,
          endpoint: "/banking/cards/:id + /limit + /invoice",
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "card_info_request_failed",
        metadata: {
          correlationId: input.correlationId,
          endpoint: "/banking/cards/:id + /limit + /invoice",
        },
      };
    }
  }
}
