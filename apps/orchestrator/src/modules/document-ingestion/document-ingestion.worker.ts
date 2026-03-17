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

type DocumentIngestionStep =
  | "PARSING"
  | "CHUNKING"
  | "EMBEDDING"
  | "INDEXING";

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
    const startedAt = Date.now();
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
      await this.updateStep(payload, "PARSING");

      const fileBuffer = Buffer.from(payload.fileContentBase64, "base64");
      const parsedText = await this.parserService.parse({
        fileBuffer,
        filename: payload.filename,
        mimeType: payload.mimeType,
      });

      await this.updateStep(payload, "CHUNKING");
      const chunks = this.chunkingService.splitText(parsedText, {
        chunkSize: payload.chunkSize,
        chunkOverlap: payload.chunkOverlap,
      });

      await this.updateStep(payload, "EMBEDDING");
      const embeddings = await this.embeddingService.generateEmbeddings(chunks);

      await this.updateStep(payload, "INDEXING");
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
      this.metricsService.increment("documents_ingestion_completed_total");
      this.metricsService.record(
        "documents_ingestion_duration_ms",
        Date.now() - startedAt,
      );
      this.logger.log(
        "Async document ingestion completed",
        DocumentIngestionWorkerService.name,
        {
          sourceId: payload.sourceId,
          tenantId: payload.tenantId,
          chunkCount: chunks.length,
          durationMs: Date.now() - startedAt,
        },
      );
    } catch (error) {
      this.metricsService.increment("document_ingestion_consumer_failure_total");
      this.metricsService.increment("documents_ingestion_failed_total");
      this.metricsService.record(
        "documents_ingestion_duration_ms",
        Date.now() - startedAt,
      );
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
          durationMs: Date.now() - startedAt,
        },
      );
    } finally {
      this.tracingService.endSpan(span);
    }
  }

  private async updateStep(
    payload: DocumentIngestionRequestedEvent,
    currentStep: DocumentIngestionStep,
  ): Promise<void> {
    this.logger.log(
      "Advancing async document ingestion step",
      DocumentIngestionWorkerService.name,
      {
        sourceId: payload.sourceId,
        tenantId: payload.tenantId,
        currentStep,
      },
    );

    await this.ingestionInternalClient.updateIngestionStatus({
      sourceId: payload.sourceId,
      status: "PROCESSING",
      currentStep,
    });
  }
}
