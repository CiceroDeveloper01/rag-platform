import { Injectable } from "@nestjs/common";
import { summarizeContent } from "../shared/banking-message.utils";
import { RagSupportService } from "../shared/rag-support.service";
import { SpecialistExecutionContext, SpecialistResult } from "../specialist.types";

@Injectable()
export class FaqSpecialist {
  constructor(private readonly ragSupportService: RagSupportService) {}

  async execute(context: SpecialistExecutionContext): Promise<SpecialistResult> {
    const { retrievedDocuments, ragContext } = await this.ragSupportService.retrieve({
      tenantId: context.tenantId,
      question: context.message.body,
      queryEmbedding: context.queryEmbedding,
      language: context.detectedLanguage,
      limit: 3,
    });

    const highlights =
      retrievedDocuments.length > 0
        ? retrievedDocuments
            .slice(0, 2)
            .map((document) => `- ${document.source}: ${summarizeContent(document.content, 150)}`)
            .join("\n")
        : "- Nao encontrei documento institucional aderente o suficiente para responder com precisao.";

    return {
      responseText: `Encontrei estas referencias institucionais para te orientar:\n${highlights}`,
      llmContext: ragContext,
      usedRag: true,
      retrievedDocuments,
      toolCalls: [],
    };
  }
}
