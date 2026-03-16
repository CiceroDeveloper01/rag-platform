import { Injectable } from "@nestjs/common";
import { DocumentIndexerService } from "../rag/document-indexer.service";

@Injectable()
export class GenerateEmbeddingsToolService {
  constructor(
    private readonly documentIndexerService: DocumentIndexerService,
  ) {}

  execute(chunks: string[]): number[][] {
    return chunks.map((chunk) =>
      this.documentIndexerService.createQueryEmbedding(chunk),
    );
  }
}
