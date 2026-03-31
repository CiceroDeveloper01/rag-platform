import { Injectable } from "@nestjs/common";
import { SimulateLoanToolService } from "../../tools/banking/simulate-loan.tool";
import { extractCurrencyAmount, extractInstallments } from "../shared/banking-message.utils";
import { RagSupportService } from "../shared/rag-support.service";
import { SpecialistExecutionContext, SpecialistResult } from "../specialist.types";

@Injectable()
export class CreditSpecialist {
  constructor(
    private readonly ragSupportService: RagSupportService,
    private readonly simulateLoanToolService: SimulateLoanToolService,
  ) {}

  async execute(context: SpecialistExecutionContext): Promise<SpecialistResult> {
    const { retrievedDocuments, ragContext } = await this.ragSupportService.retrieve({
      tenantId: context.tenantId,
      question: context.message.body,
      queryEmbedding: context.queryEmbedding,
      language: context.detectedLanguage,
      limit: 2,
    });
    const amount = extractCurrencyAmount(context.message.body);
    if (!amount) {
      return {
        responseText:
          "Posso simular seu credito, mas preciso do valor desejado e, se quiser, da quantidade de parcelas.",
        llmContext: ragContext,
        usedRag: true,
        retrievedDocuments,
        toolCalls: [],
      };
    }

    const simulation = this.simulateLoanToolService.execute({
      amount,
      installments: extractInstallments(context.message.body),
    });

    return {
      responseText: `Para R$ ${simulation.amount.toFixed(2)}, a simulacao inicial em ${simulation.installments} parcelas ficou em R$ ${simulation.installmentAmount.toFixed(2)} por mes, com taxa estimada de ${(simulation.monthlyRate * 100).toFixed(2)}% ao mes.`,
      llmContext: ragContext,
      usedRag: true,
      retrievedDocuments,
      toolCalls: ["SimulateLoan"],
    };
  }
}
