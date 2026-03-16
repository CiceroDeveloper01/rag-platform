import { Injectable } from "@nestjs/common";
import { AppLoggerService } from "@rag-platform/observability";
import { DocumentIndexerService } from "../rag/document-indexer.service";
import { VectorRepository } from "../rag/vector.repository";

export interface KnowledgeUpdateSuggestion {
  operation: "addDocument" | "updateDocument" | "rebuildEmbeddings";
  applied: boolean;
  target?: string;
  source?: string;
  notes: string;
}

@Injectable()
export class KnowledgeUpdaterService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly vectorRepository: VectorRepository,
    private readonly documentIndexerService: DocumentIndexerService,
  ) {}

  async addDocument(
    text: string,
    source: string,
    options?: { apply?: boolean },
  ): Promise<KnowledgeUpdateSuggestion> {
    const apply = options?.apply ?? false;

    if (apply) {
      await this.documentIndexerService.indexDocument(text, source);
    }

    const suggestion = {
      operation: "addDocument" as const,
      applied: apply,
      source,
      notes: apply
        ? "Document added to the knowledge base."
        : "Candidate document identified for addition to the knowledge base.",
    };

    this.logger.log(
      "Knowledge update prepared",
      KnowledgeUpdaterService.name,
      suggestion,
    );
    return suggestion;
  }

  async updateDocument(
    documentId: string,
    text: string,
    options?: { apply?: boolean },
  ): Promise<KnowledgeUpdateSuggestion> {
    const apply = options?.apply ?? false;
    const existing = this.vectorRepository.findById(documentId);

    if (apply && existing) {
      this.vectorRepository.save({
        ...existing,
        content: text,
        embedding: this.documentIndexerService.createQueryEmbedding(text),
      });
    }

    const suggestion = {
      operation: "updateDocument" as const,
      applied: apply && Boolean(existing),
      target: documentId,
      source: existing?.source,
      notes: existing
        ? apply
          ? "Existing document updated with rebuilt embedding."
          : "Existing document should be reviewed and refreshed."
        : "Suggested document update skipped because the target was not found.",
    };

    this.logger.log(
      "Knowledge update prepared",
      KnowledgeUpdaterService.name,
      suggestion,
    );
    return suggestion;
  }

  async rebuildEmbeddings(options?: {
    apply?: boolean;
  }): Promise<KnowledgeUpdateSuggestion> {
    const apply = options?.apply ?? false;
    const documents = this.vectorRepository.getAll();

    if (apply) {
      for (const document of documents) {
        this.vectorRepository.save({
          ...document,
          embedding: this.documentIndexerService.createQueryEmbedding(
            document.content,
          ),
        });
      }
    }

    const suggestion = {
      operation: "rebuildEmbeddings" as const,
      applied: apply,
      notes: apply
        ? `Rebuilt embeddings for ${documents.length} indexed documents.`
        : `Scheduled embedding rebuild review for ${documents.length} indexed documents.`,
    };

    this.logger.log(
      "Knowledge update prepared",
      KnowledgeUpdaterService.name,
      suggestion,
    );
    return suggestion;
  }
}
