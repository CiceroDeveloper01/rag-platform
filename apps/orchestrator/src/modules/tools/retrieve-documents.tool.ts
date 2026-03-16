import { Injectable } from "@nestjs/common";
import { RetrievalService } from "../rag/retrieval.service";

@Injectable()
export class RetrieveDocumentsToolService {
  constructor(private readonly retrievalService: RetrievalService) {}

  execute(payload: {
    tenantId: string;
    question: string;
    queryEmbedding?: number[];
    limit?: number;
  }) {
    return this.retrievalService.retrieveRelevantDocuments(payload);
  }
}
