import { Injectable } from "@nestjs/common";
import type { DocumentIngestionRequestedEvent } from "@rag-platform/contracts";
import {
  AppLoggerService,
  MetricsService,
  TracingService,
} from "@rag-platform/observability";
import { DocumentIngestionInternalClient } from "@rag-platform/sdk";
import { DocumentChunkingService } from "./document-chunking.service";
import { DocumentEmbeddingService } from "./document-embedding.service";
import { DocumentParserService } from "./document-parser.service";

@Injectable()
export class DocumentIngestionWorkerService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly metricsService: MetricsService,
    private readonly tracingService: TracingService,
    private readonly parserService: DocumentParserService,
    private readonly chunkingService: DocumentChunkingService,
    private readonly embeddingService: DocumentEmbeddingService,
    private readonly ingestionInternalClient: DocumentIngestionInternalClient,
  ) {}

  async process(payload: DocumentIngestionRequestedEvent): Promise<void> {
    const span = this.tracingService.startSpan("document_ingestion_worker");

    this.logger.log(
      "Starting async document ingestion processing",
      DocumentIngestionWorkerService.name,
      {
        sourceId: payload.sourceId,
        tenantId: payload.tenantId,
        filename: payload.filename,
      },
    );

    try {
      const fileBuffer = Buffer.from(payload.fileContentBase64, "base64");
      const parsedText = await this.parserService.parse({
        fileBuffer,
        filename: payload.filename,
        mimeType: payload.mimeType,
      });
      const chunks = this.chunkingService.splitText(parsedText, {
        chunkSize: payload.chunkSize,
        chunkOverlap: payload.chunkOverlap,
      });
      const embeddings = await this.embeddingService.generateEmbeddings(chunks);

      await this.ingestionInternalClient.completeIngestion({
        sourceId: payload.sourceId,
        tenantId: payload.tenantId,
        filename: payload.filename,
        mimeType: payload.mimeType,
        chunks: chunks.map((content, index) => ({
          content,
          embedding: embeddings[index] ?? [],
          metadata: {
            source: payload.filename,
            storageKey: payload.storageKey,
            storageUrl: payload.storageUrl,
            ...(payload.metadata ?? {}),
          },
        })),
      });

      this.metricsService.increment("document_ingestion_consumer_success_total");
      this.logger.log(
        "Async document ingestion completed",
        DocumentIngestionWorkerService.name,
        {
          sourceId: payload.sourceId,
          tenantId: payload.tenantId,
          chunkCount: chunks.length,
        },
      );
    } catch (error) {
      this.metricsService.increment("document_ingestion_consumer_failure_total");
      await this.ingestionInternalClient.failIngestion({
        sourceId: payload.sourceId,
        reason:
          error instanceof Error ? error.message : "document_ingestion_failed",
      });
      this.logger.error(
        "Async document ingestion failed",
        error instanceof Error ? error.stack : undefined,
        DocumentIngestionWorkerService.name,
        {
          sourceId: payload.sourceId,
          tenantId: payload.tenantId,
        },
      );
    } finally {
      this.tracingService.endSpan(span);
    }
  }
}
