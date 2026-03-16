import {
  AppLoggerService,
  MetricsService,
  TracingService,
} from "@rag-platform/observability";
import { DocumentIngestionPipelineService } from "./document-ingestion.pipeline";
import { ChunkDocumentToolService } from "./chunk-document.tool";
import { DownloadFileToolService } from "./download-file.tool";
import { GenerateEmbeddingsToolService } from "./generate-embeddings.tool";
import { IndexDocumentToolService } from "./index-document.tool";
import { ParseDocumentToolService } from "./parse-document.tool";
import { StoreDocumentToolService } from "./store-document.tool";

describe("DocumentIngestionPipelineService", () => {
  it("downloads, parses, chunks and indexes a channel-agnostic document", async () => {
    const configService = {
      get: jest.fn((key: string, fallback?: unknown) => {
        const values: Record<string, unknown> = {
          "features.documentIngestionEnabled": true,
          "features.documentParsingEnabled": true,
        };
        return values[key] ?? fallback;
      }),
    };
    const service = new DocumentIngestionPipelineService(
      configService as never,
      { log: jest.fn() } as unknown as AppLoggerService,
      { increment: jest.fn() } as unknown as MetricsService,
      {
        startSpan: jest
          .fn()
          .mockReturnValue({ name: "document_agent_execution" }),
        endSpan: jest.fn(),
      } as unknown as TracingService,
      new DownloadFileToolService(),
      new ParseDocumentToolService(),
      new ChunkDocumentToolService(),
      {
        execute: jest.fn().mockReturnValue([[0.1], [0.2]]),
      } as unknown as GenerateEmbeddingsToolService,
      new StoreDocumentToolService(),
      {
        execute: jest.fn().mockResolvedValue([
          {
            id: "chunk-1",
            content: "Policy A",
            source: "doc",
            embedding: [],
            createdAt: "now",
          },
        ]),
      } as unknown as IndexDocumentToolService,
    );

    const result = await service.ingest({
      eventType: "message.received",
      channel: "TELEGRAM" as never,
      externalMessageId: "doc-1",
      conversationId: "chat-1",
      from: "ada",
      body: "Billing policy",
      text: "Billing policy",
      messageType: "document",
      document: {
        providerFileId: "file-1",
        fileName: "policy.pdf",
        mimeType: "application/pdf",
        extractedText: "Billing policy for customer invoices",
      },
      receivedAt: new Date().toISOString(),
      metadata: {
        tenantId: "tenant-a",
      },
    });

    expect(result.documentId).toBe("file-1");
    expect(result.fileName).toBe("policy.pdf");
    expect(result.chunkCount).toBeGreaterThan(0);
  });

  it("skips ingestion safely when document ingestion is disabled", async () => {
    const metricsService = {
      increment: jest.fn(),
    } as unknown as MetricsService;
    const downloadFileToolService = {
      execute: jest.fn(),
    } as unknown as DownloadFileToolService;
    const service = new DocumentIngestionPipelineService(
      {
        get: jest.fn((key: string, fallback?: unknown) =>
          key === "features.documentIngestionEnabled" ? false : fallback,
        ),
      } as never,
      { log: jest.fn(), warn: jest.fn() } as unknown as AppLoggerService,
      metricsService,
      {
        startSpan: jest
          .fn()
          .mockReturnValue({ name: "document_agent_execution" }),
        endSpan: jest.fn(),
      } as unknown as TracingService,
      downloadFileToolService,
      { execute: jest.fn() } as unknown as ParseDocumentToolService,
      { execute: jest.fn() } as unknown as ChunkDocumentToolService,
      { execute: jest.fn() } as unknown as GenerateEmbeddingsToolService,
      { execute: jest.fn() } as unknown as StoreDocumentToolService,
      { execute: jest.fn() } as unknown as IndexDocumentToolService,
    );

    const result = await service.ingest({
      eventType: "message.received",
      channel: "TELEGRAM" as never,
      externalMessageId: "doc-disabled",
      from: "ada",
      body: "ignored",
      messageType: "document",
      document: {
        providerFileId: "provider-1",
        fileName: "policy.pdf",
        mimeType: "application/pdf",
      },
      receivedAt: new Date().toISOString(),
      metadata: {
        tenantId: "tenant-a",
      },
    });

    expect(result).toEqual({
      documentId: "doc-disabled",
      chunkCount: 0,
      fileName: "policy.pdf",
    });
    expect(downloadFileToolService.execute).not.toHaveBeenCalled();
    expect(metricsService.increment).toHaveBeenCalledWith(
      "document_ingestion_skipped_total",
    );
  });

  it("skips parsing safely when document parsing is disabled", async () => {
    const parseDocumentToolService = {
      execute: jest.fn(),
    } as unknown as ParseDocumentToolService;
    const chunkDocumentToolService = {
      execute: jest.fn().mockReturnValue(["chunk-1"]),
    } as unknown as ChunkDocumentToolService;
    const storeDocumentToolService = {
      execute: jest.fn().mockResolvedValue({
        documentId: "file-1",
        metadata: {
          documentId: "file-1",
        },
      }),
    } as unknown as StoreDocumentToolService;
    const service = new DocumentIngestionPipelineService(
      {
        get: jest.fn((key: string, fallback?: unknown) => {
          const values: Record<string, unknown> = {
            "features.documentIngestionEnabled": true,
            "features.documentParsingEnabled": false,
          };
          return values[key] ?? fallback;
        }),
      } as never,
      { log: jest.fn(), warn: jest.fn() } as unknown as AppLoggerService,
      { increment: jest.fn() } as unknown as MetricsService,
      {
        startSpan: jest
          .fn()
          .mockReturnValue({ name: "document_agent_execution" }),
        endSpan: jest.fn(),
      } as unknown as TracingService,
      new DownloadFileToolService(),
      parseDocumentToolService,
      chunkDocumentToolService,
      {
        execute: jest.fn().mockReturnValue([[0.1]]),
      } as unknown as GenerateEmbeddingsToolService,
      storeDocumentToolService,
      {
        execute: jest.fn().mockResolvedValue([]),
      } as unknown as IndexDocumentToolService,
    );

    await service.ingest({
      eventType: "message.received",
      channel: "TELEGRAM" as never,
      externalMessageId: "doc-no-parse",
      from: "ada",
      body: "body fallback",
      text: "body fallback",
      messageType: "document",
      document: {
        providerFileId: "file-1",
        fileName: "policy.pdf",
        mimeType: "application/pdf",
      },
      receivedAt: new Date().toISOString(),
      metadata: {
        tenantId: "tenant-a",
      },
    });

    expect(parseDocumentToolService.execute).not.toHaveBeenCalled();
    expect(chunkDocumentToolService.execute).toHaveBeenCalledWith(
      "body fallback",
    );
  });
});
