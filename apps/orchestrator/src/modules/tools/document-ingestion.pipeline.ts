import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ChannelMessageEvent } from "@rag-platform/contracts";
import {
  AppLoggerService,
  MetricsService,
  RAG_DOCUMENT_INDEX_TOTAL,
  TracingService,
} from "@rag-platform/observability";
import { ChunkDocumentToolService } from "./chunk-document.tool";
import { DownloadFileToolService } from "./download-file.tool";
import { GenerateEmbeddingsToolService } from "./generate-embeddings.tool";
import { IndexDocumentToolService } from "./index-document.tool";
import { ParseDocumentToolService } from "./parse-document.tool";
import { StoreDocumentToolService } from "./store-document.tool";

@Injectable()
export class DocumentIngestionPipelineService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
    private readonly metricsService: MetricsService,
    private readonly tracingService: TracingService,
    private readonly downloadFileToolService: DownloadFileToolService,
    private readonly parseDocumentToolService: ParseDocumentToolService,
    private readonly chunkDocumentToolService: ChunkDocumentToolService,
    private readonly generateEmbeddingsToolService: GenerateEmbeddingsToolService,
    private readonly storeDocumentToolService: StoreDocumentToolService,
    private readonly indexDocumentToolService: IndexDocumentToolService,
  ) {}

  async ingest(message: ChannelMessageEvent): Promise<{
    documentId: string;
    chunkCount: number;
    fileName: string;
  }> {
    const trace = this.tracingService.startSpan("document_agent_execution");
    const tenantId =
      typeof message.metadata?.tenantId === "string"
        ? message.metadata.tenantId
        : "default-tenant";
    try {
      if (!this.isDocumentIngestionEnabled()) {
        this.metricsService.increment("document_ingestion_skipped_total");
        this.logger.warn(
          "Document ingestion skipped because the feature toggle is disabled",
          DocumentIngestionPipelineService.name,
          {
            externalMessageId: message.externalMessageId,
            tenantId,
            channel: message.channel,
          },
        );

        return {
          documentId: message.externalMessageId,
          chunkCount: 0,
          fileName: message.document?.fileName ?? "document",
        };
      }

      const downloaded = await this.downloadFileToolService.execute({
        message,
      });
      const parsedText = this.isDocumentParsingEnabled()
        ? await this.parseDocumentToolService.execute(downloaded)
        : this.buildParsingFallback(message, downloaded);
      const chunks = this.chunkDocumentToolService.execute(parsedText);
      this.generateEmbeddingsToolService.execute(chunks);
      const stored = await this.storeDocumentToolService.execute({
        documentId: downloaded.documentId,
        tenantId,
        channel: String(message.channel),
        conversationId: message.conversationId,
        fileName: downloaded.fileName,
        mimeType: downloaded.mimeType,
        fileSize: downloaded.fileSize,
        createdAt: message.receivedAt,
        providerFileId: downloaded.providerFileId,
      });
      await this.indexDocumentToolService.execute({
        chunks,
        source: `channel:${String(message.channel)}:${downloaded.fileName}`,
        tenantId,
        externalMessageId: message.externalMessageId,
        metadata: stored.metadata,
      });

      this.metricsService.increment(RAG_DOCUMENT_INDEX_TOTAL);
      this.logger.log(
        "Document indexed through agent-first pipeline",
        DocumentIngestionPipelineService.name,
        {
          externalMessageId: message.externalMessageId,
          documentId: stored.documentId,
          chunkCount: chunks.length,
          channel: message.channel,
        },
      );

      return {
        documentId: stored.documentId,
        chunkCount: chunks.length,
        fileName: downloaded.fileName,
      };
    } finally {
      this.tracingService.endSpan(trace);
    }
  }

  private isDocumentIngestionEnabled(): boolean {
    return (
      this.configService.get<boolean>(
        "features.documentIngestionEnabled",
        true,
      ) ?? true
    );
  }

  private isDocumentParsingEnabled(): boolean {
    return (
      this.configService.get<boolean>(
        "features.documentParsingEnabled",
        true,
      ) ?? true
    );
  }

  private buildParsingFallback(
    message: ChannelMessageEvent,
    downloaded: {
      extractedText?: string;
      fileName: string;
      mimeType?: string;
    },
  ): string {
    this.metricsService.increment("document_parsing_skipped_total");
    this.logger.warn(
      "Document parsing skipped because the feature toggle is disabled",
      DocumentIngestionPipelineService.name,
      {
        externalMessageId: message.externalMessageId,
        fileName: downloaded.fileName,
        mimeType: downloaded.mimeType,
      },
    );

    return (
      message.document?.extractedText ??
      downloaded.extractedText ??
      message.text ??
      message.body ??
      downloaded.fileName
    );
  }
}
