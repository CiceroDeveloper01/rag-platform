import { Injectable } from "@nestjs/common";
import { Tool, ToolInput, ToolResult } from "../base/tool.interface";
import { ApiBusinessBankingClient } from "../../integrations/api-business/api-business-banking.client";

@Injectable()
export class BlockCardToolService implements Tool {
  readonly name = "BlockCard";

  constructor(
    private readonly apiBusinessBankingClient: ApiBusinessBankingClient,
  ) {}

  async execute(input: ToolInput): Promise<ToolResult> {
    const cardId =
      typeof input.payload.cardId === "string" ? input.payload.cardId : undefined;
    const reason =
      typeof input.payload.reason === "string"
        ? input.payload.reason
        : "unspecified";

    if (!cardId) {
      return {
        success: false,
        error: "missing_card_id",
        metadata: {
          correlationId: input.correlationId,
          endpoint: "/banking/cards/:id/block",
        },
      };
    }

    try {
      const result = await this.apiBusinessBankingClient.blockCard({
        cardId,
        reason,
        requestedBy: input.userId,
        correlationId: input.correlationId,
        tenantId: input.tenantId,
      });

      return {
        success: true,
        data: {
          cardId: result.cardId,
          status: result.status,
          protocol: `${result.action.toUpperCase()}-${result.cardId}`,
          reason,
          message: result.message,
        },
        metadata: {
          correlationId: input.correlationId,
          endpoint: "/banking/cards/:id/block",
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "block_card_request_failed",
        metadata: {
          correlationId: input.correlationId,
          endpoint: "/banking/cards/:id/block",
        },
      };
    }
  }
}
