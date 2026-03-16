import { Injectable } from "@nestjs/common";
import { DocumentIndexerService } from "../rag/document-indexer.service";
import { RagDocumentRecord } from "../rag/vector.repository";

@Injectable()
export class IndexDocumentToolService {
  constructor(
    private readonly documentIndexerService: DocumentIndexerService,
  ) {}

  async execute(payload: {
    chunks: string[];
    source: string;
    tenantId: string;
    externalMessageId: string;
    metadata: Record<string, unknown>;
  }): Promise<RagDocumentRecord[]> {
    const records: RagDocumentRecord[] = [];

    for (let index = 0; index < payload.chunks.length; index += 1) {
      const chunk = payload.chunks[index];
      const record = await this.documentIndexerService.indexDocument(
        chunk,
        `${payload.source}:chunk-${index + 1}`,
        {
          tenantId: payload.tenantId,
          externalMessageId: `${payload.externalMessageId}:chunk-${index + 1}`,
          metadata: {
            ...payload.metadata,
            chunkIndex: index + 1,
            chunkCount: payload.chunks.length,
          },
        },
      );
      records.push(record);
    }

    return records;
  }
}
