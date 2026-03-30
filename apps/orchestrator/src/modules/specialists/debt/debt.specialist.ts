import { Injectable } from "@nestjs/common";
import { CreateNegotiationProposalToolService } from "../../tools/banking/create-negotiation-proposal.tool";
import { GetDebtStatusToolService } from "../../tools/banking/get-debt-status.tool";
import { RagSupportService } from "../shared/rag-support.service";
import { SpecialistExecutionContext, SpecialistResult } from "../specialist.types";

@Injectable()
export class DebtSpecialist {
  constructor(
    private readonly ragSupportService: RagSupportService,
    private readonly getDebtStatusToolService: GetDebtStatusToolService,
    private readonly createNegotiationProposalToolService: CreateNegotiationProposalToolService,
  ) {}

  async execute(context: SpecialistExecutionContext): Promise<SpecialistResult> {
    const { retrievedDocuments, ragContext } = await this.ragSupportService.retrieve({
      tenantId: context.tenantId,
      question: context.message.body,
      queryEmbedding: context.queryEmbedding,
      language: context.detectedLanguage,
      limit: 2,
    });
    const debtStatus = this.getDebtStatusToolService.execute();
    const proposal = this.createNegotiationProposalToolService.execute({
      amount: debtStatus.overdueAmount,
    });

    return {
      responseText: [
        `Encontrei ${debtStatus.contractsInArrears} contrato em atraso, com saldo vencido de R$ ${debtStatus.overdueAmount.toFixed(2)} e atraso maximo de ${debtStatus.oldestDelayDays} dias.`,
        `Proposta inicial: entrada de R$ ${proposal.entryAmount.toFixed(2)} e ${proposal.installmentCount} parcelas de R$ ${proposal.installmentAmount.toFixed(2)}.`,
        `Desconto estimado para negociacao digital: ${proposal.discountPercentage}%.`,
      ].join("\n"),
      llmContext: ragContext,
      usedRag: true,
      retrievedDocuments,
      toolCalls: ["GetDebtStatus", "CreateNegotiationProposal"],
    };
  }
}
