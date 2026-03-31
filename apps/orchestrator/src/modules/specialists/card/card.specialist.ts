import { Injectable } from "@nestjs/common";
import { GuardrailService } from "../../guardrails/guardrail.service";
import { BlockCardToolService } from "../../tools/banking/block-card.tool";
import { GetCardInfoToolService } from "../../tools/banking/get-card-info.tool";
import { hasConfirmationIntent } from "../shared/banking-message.utils";
import { SpecialistExecutionContext, SpecialistResult } from "../specialist.types";

@Injectable()
export class CardSpecialist {
  constructor(
    private readonly guardrailService: GuardrailService,
    private readonly getCardInfoToolService: GetCardInfoToolService,
    private readonly blockCardToolService: BlockCardToolService,
  ) {}

  async execute(context: SpecialistExecutionContext): Promise<SpecialistResult> {
    const normalized = context.message.body.toLowerCase();
    const rawUserId = context.message.userId ?? context.message.from;
    const userId = rawUserId || "unknown-user";
    const correlationId = context.message.externalMessageId;
    const tenantId = context.tenantId;
    const confirmed = hasConfirmationIntent(context.message.body);
    const explicitCardId =
      typeof context.message.metadata?.cardId === "string"
        ? context.message.metadata.cardId
        : undefined;

    if (context.decision.sensitivity === "sensitive") {
      const guardrailDecision = this.guardrailService.evaluateSensitiveOperation({
        requiresConfirmation: true,
        confirmed,
        hasMinimumContext: Boolean(rawUserId && correlationId),
        language: context.detectedLanguage,
      });

      if (!guardrailDecision.allowed) {
        return {
          responseText:
            guardrailDecision.responseText ??
            "Nao foi possivel seguir com a operacao sensivel.",
          usedRag: false,
          retrievedDocuments: [],
          toolCalls: [],
        };
      }

      const cardInfoResult = await this.getCardInfoToolService.execute({
        userId,
        tenantId,
        correlationId,
        payload: {
          cardId: explicitCardId,
        },
      });

      if (!cardInfoResult.success) {
        return {
          responseText:
            "Nao consegui identificar qual cartao deve ser bloqueado. Informe o cartao ou tente novamente mais tarde.",
          usedRag: false,
          retrievedDocuments: [],
          toolCalls: [this.getCardInfoToolService.name],
          metadata: {
            toolError: cardInfoResult.error,
          },
        };
      }

      const cardInfo = cardInfoResult.data as { cardId: string };
      const toolResult = await this.blockCardToolService.execute({
        userId,
        tenantId,
        correlationId,
        payload: {
          cardId: cardInfo.cardId,
          reason: "reported_lost_or_fraud",
        },
      });

      if (!toolResult.success) {
        return {
          responseText:
            "Nao consegui concluir o bloqueio do cartao agora. Tente novamente em instantes ou solicite atendimento humano.",
          usedRag: false,
          retrievedDocuments: [],
          toolCalls: [this.blockCardToolService.name],
          metadata: {
            toolError: toolResult.error,
          },
        };
      }

      return {
        responseText: `Bloqueio do cartao solicitado com sucesso. Protocolo ${String((toolResult.data as { protocol: string }).protocol)}. Se quiser, eu tambem posso orientar sobre segunda via.`,
        usedRag: false,
        retrievedDocuments: [],
        toolCalls: [this.blockCardToolService.name],
        metadata: {
          protocol: String((toolResult.data as { protocol: string }).protocol),
        },
      };
    }

    const toolResult = await this.getCardInfoToolService.execute({
      userId,
      tenantId,
      correlationId,
      payload: {
        cardId: explicitCardId,
      },
    });
    if (!toolResult.success) {
      return {
        responseText:
          "Nao consegui consultar os dados do cartao neste momento. Tente novamente em instantes.",
        usedRag: false,
        retrievedDocuments: [],
        toolCalls: [this.getCardInfoToolService.name],
        metadata: {
          toolError: toolResult.error,
        },
      };
    }
    const cardInfo = toolResult.data as {
      cardId: string;
      status: string;
      limit: number;
      invoiceAmount: number;
      invoiceDueDate: string;
    };

    return {
      responseText:
        normalized.includes("fatura") || normalized.includes("invoice")
          ? `Seu cartao esta ${cardInfo.status}, com limite de R$ ${cardInfo.limit.toFixed(2)} e fatura atual de R$ ${cardInfo.invoiceAmount.toFixed(2)} com vencimento em ${cardInfo.invoiceDueDate}.`
          : `Seu cartao esta ${cardInfo.status}, com limite disponivel de R$ ${cardInfo.limit.toFixed(2)} e fatura atual de R$ ${cardInfo.invoiceAmount.toFixed(2)}.`,
      usedRag: false,
      retrievedDocuments: [],
      toolCalls: [this.getCardInfoToolService.name],
    };
  }
}
