import { ConfigService } from "@nestjs/config";
import {
  AppLoggerService,
  MetricsService,
  TracingService,
} from "@rag-platform/observability";
import { RagSearchInternalClient } from "@rag-platform/sdk";
import { RetrievalService } from "../rag/retrieval.service";
import { VectorRepository } from "../rag/vector.repository";
import { DocumentIndexerService } from "../rag/document-indexer.service";

describe("Document ingestion to RAG flow", () => {
  it("indexes a document and retrieves it later for a user question", async () => {
    const logger = {
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as AppLoggerService;
    const metrics = {
      increment: jest.fn(),
      record: jest.fn(),
    } as unknown as MetricsService;
    const tracing = {
      startSpan: jest.fn().mockReturnValue({ name: "span", startedAt: "now" }),
      endSpan: jest.fn(),
    } as unknown as TracingService;
    const vectorRepository = new VectorRepository();
    const documentIndexerService = new DocumentIndexerService(
      logger,
      metrics,
      tracing,
      {
        registerDocument: jest
          .fn()
          .mockResolvedValue({ success: true, documentId: "doc-1" }),
      } as any,
      vectorRepository,
    );

    await documentIndexerService.indexDocument(
      "Billing invoices are available in the customer portal.",
      "channel:TELEGRAM:policy.pdf",
      {
        tenantId: "tenant-a",
        externalMessageId: "msg-1",
        metadata: {
          documentId: "doc-1",
          fileName: "policy.pdf",
        },
      },
    );

    const retrievalService = new RetrievalService(
      {
        get: jest.fn((key: string, fallback?: unknown) => {
          const values: Record<string, unknown> = {
            "features.ragRetrievalEnabled": true,
            "rag.topK": 5,
          };
          return values[key] ?? fallback;
        }),
      } as unknown as ConfigService,
      logger,
      metrics,
      tracing,
      {
        query: jest.fn().mockRejectedValue(new Error("offline")),
      } as unknown as RagSearchInternalClient,
      vectorRepository,
    );

    const result = await retrievalService.retrieveRelevantDocuments({
      tenantId: "tenant-a",
      question: "Where are invoices available?",
      queryEmbedding: documentIndexerService.createQueryEmbedding(
        "Where are invoices available?",
      ),
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.content).toContain("customer portal");
  });

  it("degrades safely when retrieval is disabled after indexing", async () => {
    const logger = {
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as AppLoggerService;
    const metrics = {
      increment: jest.fn(),
      record: jest.fn(),
    } as unknown as MetricsService;
    const tracing = {
      startSpan: jest.fn().mockReturnValue({ name: "span", startedAt: "now" }),
      endSpan: jest.fn(),
    } as unknown as TracingService;
    const vectorRepository = new VectorRepository();
    const documentIndexerService = new DocumentIndexerService(
      logger,
      metrics,
      tracing,
      {
        registerDocument: jest
          .fn()
          .mockResolvedValue({ success: true, documentId: "doc-2" }),
      } as any,
      vectorRepository,
    );

    await documentIndexerService.indexDocument(
      "Invoices are archived in the tenant portal.",
      "channel:TELEGRAM:guide.pdf",
      {
        tenantId: "tenant-a",
        externalMessageId: "msg-2",
        metadata: {
          documentId: "doc-2",
          fileName: "guide.pdf",
        },
      },
    );

    const retrievalService = new RetrievalService(
      {
        get: jest.fn((key: string, fallback?: unknown) =>
          key === "features.ragRetrievalEnabled" ? false : fallback,
        ),
      } as unknown as ConfigService,
      logger,
      metrics,
      tracing,
      { query: jest.fn() } as unknown as RagSearchInternalClient,
      vectorRepository,
    );

    const result = await retrievalService.retrieveRelevantDocuments({
      tenantId: "tenant-a",
      question: "Where are invoices archived?",
      queryEmbedding: documentIndexerService.createQueryEmbedding(
        "Where are invoices archived?",
      ),
    });

    expect(result).toEqual([]);
  });
});
