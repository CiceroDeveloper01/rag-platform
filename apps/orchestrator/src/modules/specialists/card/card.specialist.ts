import { Injectable } from "@nestjs/common";
import { BlockCardToolService } from "../../tools/banking/block-card.tool";
import { GetCardsToolService } from "../../tools/banking/get-cards.tool";
import { GetInvoiceToolService } from "../../tools/banking/get-invoice.tool";
import { hasConfirmationIntent } from "../shared/banking-message.utils";
import { SpecialistExecutionContext, SpecialistResult } from "../specialist.types";

@Injectable()
export class CardSpecialist {
  constructor(
    private readonly getCardsToolService: GetCardsToolService,
    private readonly blockCardToolService: BlockCardToolService,
    private readonly getInvoiceToolService: GetInvoiceToolService,
  ) {}

  async execute(context: SpecialistExecutionContext): Promise<SpecialistResult> {
    const normalized = context.message.body.toLowerCase();

    if (normalized.includes("fatura") || normalized.includes("invoice")) {
      const invoice = this.getInvoiceToolService.execute();
      return {
        responseText: `Sua fatura atual esta ${invoice.status}, com vencimento em ${invoice.dueDate} e valor de R$ ${invoice.amountDue.toFixed(2)}. O pagamento minimo e R$ ${invoice.minimumPayment.toFixed(2)}.`,
        usedRag: false,
        retrievedDocuments: [],
        toolCalls: ["GetInvoice"],
      };
    }

    if (
      context.decision.sensitivity === "sensitive" &&
      hasConfirmationIntent(context.message.body)
    ) {
      const result = this.blockCardToolService.execute({
        reason: "reported_lost_or_fraud",
      });
      return {
        responseText: `Bloqueio do cartao solicitado com sucesso. Protocolo ${result.protocol}. Se quiser, eu tambem posso orientar sobre segunda via.`,
        usedRag: false,
        retrievedDocuments: [],
        toolCalls: ["BlockCard"],
        metadata: {
          protocol: result.protocol,
        },
      };
    }

    const cards = this.getCardsToolService.execute();
    return {
      responseText: [
        "Encontrei os seguintes cartoes vinculados ao seu perfil:",
        ...cards.map(
          (card) =>
            `- ${card.brand} final ${card.last4}, status ${card.status} e limite de R$ ${card.limit.toFixed(2)}.`,
        ),
      ].join("\n"),
      usedRag: false,
      retrievedDocuments: [],
      toolCalls: ["GetCards"],
    };
  }
}
