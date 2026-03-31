import { Injectable } from "@nestjs/common";
import { SupportedAgentLanguage } from "../../agents/language-detection.service";
import { ContextBuilderService } from "../../rag/context-builder.service";
import { RagDocumentRecord } from "../../rag/vector.repository";
import { RetrieveDocumentsToolService } from "../../tools/retrieval/retrieve-documents.tool";

@Injectable()
export class RagSupportService {
  constructor(
    private readonly retrieveDocumentsToolService: RetrieveDocumentsToolService,
    private readonly contextBuilderService: ContextBuilderService,
  ) {}

  async retrieve(payload: {
    tenantId: string;
    question: string;
    queryEmbedding?: number[];
    language: SupportedAgentLanguage;
    limit?: number;
  }): Promise<{ retrievedDocuments: RagDocumentRecord[]; ragContext: string }> {
    const retrievedDocuments = await this.retrieveDocumentsToolService.execute({
      tenantId: payload.tenantId,
      question: payload.question,
      queryEmbedding: payload.queryEmbedding,
      limit: payload.limit,
    });

    return {
      retrievedDocuments,
      ragContext: this.contextBuilderService.buildContext(
        payload.question,
        retrievedDocuments,
        payload.language,
      ),
    };
  }
}
