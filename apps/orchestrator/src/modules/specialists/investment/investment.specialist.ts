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
    const amount = extractCurrencyAmount(context.message.body);
    const userId = context.message.userId ?? context.message.from ?? "unknown-user";
    const correlationId = context.message.externalMessageId;

    if (amount) {
      const simulationResult = await this.simulateInvestmentToolService.execute({
        userId,
        tenantId: context.tenantId,
        correlationId,
        payload: {
          amount,
          productType: "cdb",
          periodInDays: 365,
        },
      });
      if (!simulationResult.success) {
        return {
          responseText:
            "Nao consegui simular o investimento neste momento. Confira os dados informados e tente novamente.",
          usedRag: false,
          retrievedDocuments: [],
          toolCalls: [this.simulateInvestmentToolService.name],
          metadata: {
            toolError: simulationResult.error,
          },
        };
      }
      const simulation = simulationResult.data as {
        amount: number;
        projectedGross: number;
        termMonths: number;
      };
      const products = this.getInvestmentProductsToolService.execute();

      return {
        responseText: [
          `Para um aporte de R$ ${simulation.amount.toFixed(2)}, a simulacao de ${simulation.termMonths} meses projeta bruto de R$ ${simulation.projectedGross.toFixed(2)}.`,
          `Produto sugerido para perfil conservador: ${products[0]?.name ?? "CDB Liquidez Diaria"}.`,
          `Benchmark de referencia: ${products[0]?.benchmark ?? "102% CDI"}.`,
        ].join("\n"),
        usedRag: false,
        retrievedDocuments: [],
        toolCalls: [this.simulateInvestmentToolService.name],
      };
    }

    const { retrievedDocuments, ragContext } = await this.ragSupportService.retrieve({
      tenantId: context.tenantId,
      question: context.message.body,
      queryEmbedding: context.queryEmbedding,
      language: context.detectedLanguage,
      limit: 3,
    });
    const products = this.getInvestmentProductsToolService.execute();

    return {
      responseText: [
        "Posso te orientar em investimentos com base nas regras do banco e no seu objetivo.",
        "Para simular, me diga o valor que voce quer aplicar.",
        ...products
          .slice(0, 2)
          .map(
            (product) =>
              `- ${product.name}: risco ${product.risk}, referencia ${product.benchmark}.`,
          ),
      ].join("\n"),
      llmContext: ragContext,
      usedRag: true,
      retrievedDocuments,
      toolCalls: ["GetInvestmentProducts"],
    };
  }
}
