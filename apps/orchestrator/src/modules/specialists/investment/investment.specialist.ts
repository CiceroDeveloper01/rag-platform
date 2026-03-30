import { Injectable } from "@nestjs/common";
import { GetInvestmentProductsToolService } from "../../tools/banking/get-investment-products.tool";
import { SimulateInvestmentToolService } from "../../tools/banking/simulate-investment.tool";
import { extractCurrencyAmount } from "../shared/banking-message.utils";
import { RagSupportService } from "../shared/rag-support.service";
import { SpecialistExecutionContext, SpecialistResult } from "../specialist.types";

@Injectable()
export class InvestmentSpecialist {
  constructor(
    private readonly ragSupportService: RagSupportService,
    private readonly getInvestmentProductsToolService: GetInvestmentProductsToolService,
    private readonly simulateInvestmentToolService: SimulateInvestmentToolService,
  ) {}

  async execute(context: SpecialistExecutionContext): Promise<SpecialistResult> {
    const { retrievedDocuments, ragContext } = await this.ragSupportService.retrieve({
      tenantId: context.tenantId,
      question: context.message.body,
      queryEmbedding: context.queryEmbedding,
      language: context.detectedLanguage,
      limit: 3,
    });
    const products = this.getInvestmentProductsToolService.execute();
    const amount = extractCurrencyAmount(context.message.body);

    if (!amount) {
      return {
        responseText: [
          "Posso te orientar em investimentos com base nas regras do banco e no seu objetivo.",
          "Para simular, me diga o valor que voce quer aplicar.",
          ...products.slice(0, 2).map((product) => `- ${product.name}: risco ${product.risk}, referencia ${product.benchmark}.`),
        ].join("\n"),
        llmContext: ragContext,
        usedRag: true,
        retrievedDocuments,
        toolCalls: ["GetInvestmentProducts"],
      };
    }

    const simulation = this.simulateInvestmentToolService.execute({ amount });
    return {
      responseText: [
        `Para um aporte de R$ ${amount.toFixed(2)}, a simulacao de 12 meses projeta bruto de R$ ${simulation.projectedGross.toFixed(2)}.`,
        `Produto sugerido para perfil conservador: ${products[0]?.name ?? "CDB Liquidez Diaria"}.`,
        `Benchmark de referencia: ${products[0]?.benchmark ?? "102% CDI"}.`,
      ].join("\n"),
      llmContext: ragContext,
      usedRag: true,
      retrievedDocuments,
      toolCalls: ["GetInvestmentProducts", "SimulateInvestment"],
    };
  }
}
