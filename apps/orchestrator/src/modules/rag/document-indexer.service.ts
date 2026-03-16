import { Injectable } from "@nestjs/common";
import type { AttachmentPayload } from "@rag-platform/contracts";
import {
  AppLoggerService,
  MetricsService,
  RAG_DOCUMENT_INDEX_FAILURE_TOTAL,
  RAG_DOCUMENT_INDEX_TOTAL,
  TracingService,
} from "@rag-platform/observability";
import { DocumentsInternalClient } from "@rag-platform/sdk";
import { RagDocumentRecord, VectorRepository } from "./vector.repository";

const EMBEDDING_DIMENSION = 128;

@Injectable()
export class DocumentIndexerService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly metricsService: MetricsService,
    private readonly tracingService: TracingService,
    private readonly documentsInternalClient: DocumentsInternalClient,
    private readonly vectorRepository: VectorRepository,
  ) {}

  async indexDocument(
    text: string,
    source = "message-body",
    options?: {
      tenantId?: string;
      externalMessageId?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<RagDocumentRecord> {
    const content = text.trim();
    const trace = this.tracingService.startSpan("rag.document.index");
    const startedAt = Date.now();
    const externalMessageId =
      options?.externalMessageId ?? createDocumentId(source, content);

    try {
      const persisted = await this.documentsInternalClient.registerDocument({
        tenantId: options?.tenantId?.trim() || "default-tenant",
        source,
        content,
        externalMessageId,
        metadata: {
          tenantId: options?.tenantId?.trim() || "default-tenant",
          ragSource: source,
          ...(options?.metadata ?? {}),
        },
      });

      const document = this.vectorRepository.save({
        id: String(persisted.documentId ?? externalMessageId),
        content,
        source,
        embedding: createEmbedding(content),
        createdAt: new Date().toISOString(),
      });

      this.metricsService.increment(RAG_DOCUMENT_INDEX_TOTAL);
      this.metricsService.record(
        "rag_document_index_duration_ms",
        Date.now() - startedAt,
      );
      this.tracingService.endSpan(trace);

      this.logger.debug("RAG document indexed", DocumentIndexerService.name, {
        source,
        documentId: document.id,
        totalDocuments: this.vectorRepository.count(),
      });

      return document;
    } catch (error) {
      this.metricsService.increment(RAG_DOCUMENT_INDEX_FAILURE_TOTAL);
      this.tracingService.endSpan(trace);
      this.logger.error(
        "Failed to index RAG document",
        error instanceof Error ? error.stack : undefined,
        DocumentIndexerService.name,
        {
          source,
          externalMessageId,
        },
      );
      throw error;
    }
  }

  async indexAttachment(
    file: AttachmentPayload & { extractedText?: string },
  ): Promise<RagDocumentRecord> {
    const storageLocator =
      file.storageKey ?? file.providerFileId ?? file.fileName;
    const content = [
      file.fileName,
      file.mimeType,
      storageLocator,
      file.extractedText ?? "",
    ]
      .filter(Boolean)
      .join("\n");
    return this.indexDocument(content, `attachment:${storageLocator}`, {
      externalMessageId: `attachment:${storageLocator}`,
      metadata: {
        fileName: file.fileName,
        mimeType: file.mimeType,
        storageKey: file.storageKey,
        providerFileId: file.providerFileId,
        fileSize: file.fileSize,
      },
    });
  }

  createQueryEmbedding(text: string): number[] {
    return createEmbedding(text);
  }
}

function createDocumentId(source: string, content: string): string {
  const normalized = `${source}:${content}`.slice(0, 120);
  let hash = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }

  return `${source}:${hash.toString(16)}`;
}

function createEmbedding(text: string): number[] {
  const embedding = new Array<number>(EMBEDDING_DIMENSION).fill(0);
  const normalized = text.trim().toLowerCase();

  for (let index = 0; index < normalized.length; index += 1) {
    const code = normalized.charCodeAt(index);
    const bucket = index % EMBEDDING_DIMENSION;
    embedding[bucket] = (embedding[bucket] ?? 0) + code / 255;
  }

  const magnitude = Math.sqrt(
    embedding.reduce((total, value) => total + value * value, 0),
  );

  if (magnitude === 0) {
    return embedding;
  }

  return embedding.map((value) => value / magnitude);
}
