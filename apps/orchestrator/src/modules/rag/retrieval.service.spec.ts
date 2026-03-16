import { ConfigService } from "@nestjs/config";
import {
  AppLoggerService,
  MetricsService,
  TracingService,
} from "@rag-platform/observability";
import { RagSearchInternalClient } from "@rag-platform/sdk";
import { RetrievalService } from "./retrieval.service";
import { VectorRepository } from "./vector.repository";

describe("RetrievalService", () => {
  it("uses the internal api search as the primary retrieval path", async () => {
    const config = {
      get: jest.fn((key: string, fallback?: unknown) => {
        const values: Record<string, unknown> = {
          "features.ragRetrievalEnabled": true,
          "rag.topK": 5,
        };
        return values[key] ?? fallback;
      }),
    } as unknown as ConfigService;
    const logger = {
      debug: jest.fn(),
      warn: jest.fn(),
    } as unknown as AppLoggerService;
    const metrics = {
      increment: jest.fn(),
      record: jest.fn(),
    } as unknown as MetricsService;
    const tracing = {
      startSpan: jest
        .fn()
        .mockReturnValue({ name: "rag.retrieval.query", startedAt: "now" }),
      endSpan: jest.fn(),
    } as unknown as TracingService;
    const searchClient = {
      query: jest.fn().mockResolvedValue({
        question: "Where is my invoice?",
        contexts: [
          {
            id: 10,
            content: "Invoices are available in the billing portal.",
            metadata: { source: "billing-playbook.md" },
            distance: 0.11,
            source: "billing-playbook.md",
            createdAt: "2026-03-15T10:00:00.000Z",
          },
        ],
      }),
    } as unknown as RagSearchInternalClient;
    const repository = new VectorRepository();

    const service = new RetrievalService(
      config,
      logger,
      metrics,
      tracing,
      searchClient,
      repository,
    );

    const result = await service.retrieveRelevantDocuments({
      tenantId: "tenant-a",
      question: "Where is my invoice?",
      queryEmbedding: [0.1, 0.2],
    });

    expect(searchClient.query).toHaveBeenCalledWith({
      tenantId: "tenant-a",
      question: "Where is my invoice?",
      topK: 5,
    });
    expect(result[0]).toMatchObject({
      id: "10",
      source: "billing-playbook.md",
      content: "Invoices are available in the billing portal.",
    });
    expect(metrics.increment).toHaveBeenCalledWith("rag_retrieval_total");
  });

  it("falls back to the local cache when the internal search fails", async () => {
    const config = {
      get: jest.fn((key: string, fallback?: unknown) => {
        const values: Record<string, unknown> = {
          "features.ragRetrievalEnabled": true,
          "rag.topK": 3,
        };
        return values[key] ?? fallback;
      }),
    } as unknown as ConfigService;
    const logger = {
      debug: jest.fn(),
      warn: jest.fn(),
    } as unknown as AppLoggerService;
    const metrics = {
      increment: jest.fn(),
      record: jest.fn(),
    } as unknown as MetricsService;
    const tracing = {
      startSpan: jest
        .fn()
        .mockReturnValue({ name: "rag.retrieval.query", startedAt: "now" }),
      endSpan: jest.fn(),
    } as unknown as TracingService;
    const searchClient = {
      query: jest.fn().mockRejectedValue(new Error("search unavailable")),
    } as unknown as RagSearchInternalClient;
    const repository = new VectorRepository();

    repository.save({
      id: "cached-1",
      source: "fallback-doc",
      content: "Fallback semantic cache",
      embedding: [1, 0],
      createdAt: new Date().toISOString(),
    });

    const service = new RetrievalService(
      config,
      logger,
      metrics,
      tracing,
      searchClient,
      repository,
    );

    const result = await service.retrieveRelevantDocuments({
      tenantId: "tenant-a",
      question: "Fallback",
      queryEmbedding: [1, 0],
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("cached-1");
    expect(metrics.increment).toHaveBeenCalledWith(
      "rag_retrieval_failure_total",
    );
  });

  it("derives a default source and rethrows when no fallback embedding is available", async () => {
    const config = {
      get: jest.fn((key: string, fallback?: unknown) => {
        const values: Record<string, unknown> = {
          "features.ragRetrievalEnabled": true,
          "rag.topK": 2,
        };
        return values[key] ?? fallback;
      }),
    } as unknown as ConfigService;
    const logger = {
      debug: jest.fn(),
      warn: jest.fn(),
    } as unknown as AppLoggerService;
    const metrics = {
      increment: jest.fn(),
      record: jest.fn(),
    } as unknown as MetricsService;
    const tracing = {
      startSpan: jest
        .fn()
        .mockReturnValue({ name: "rag.retrieval.query", startedAt: "now" }),
      endSpan: jest.fn(),
    } as unknown as TracingService;
    const searchClient = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          question: "unknown source",
          contexts: [
            {
              id: 44,
              content: "Document content",
              metadata: {},
            },
          ],
        })
        .mockRejectedValueOnce(new Error("search unavailable")),
    } as unknown as RagSearchInternalClient;
    const repository = new VectorRepository();
    const service = new RetrievalService(
      config,
      logger,
      metrics,
      tracing,
      searchClient,
      repository,
    );

    await expect(
      service.retrieveRelevantDocuments({
        tenantId: "tenant-a",
        question: "unknown source",
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        source: "document:44",
      }),
    ]);

    await expect(
      service.retrieveRelevantDocuments({
        tenantId: "tenant-a",
        question: "should rethrow",
      }),
    ).rejects.toThrow("search unavailable");
  });

  it("returns an empty result set when retrieval is disabled", async () => {
    const searchClient = {
      query: jest.fn(),
    } as unknown as RagSearchInternalClient;
    const service = new RetrievalService(
      {
        get: jest.fn((key: string, fallback?: unknown) =>
          key === "features.ragRetrievalEnabled" ? false : fallback,
        ),
      } as unknown as ConfigService,
      { debug: jest.fn(), warn: jest.fn() } as unknown as AppLoggerService,
      { increment: jest.fn(), record: jest.fn() } as unknown as MetricsService,
      {
        startSpan: jest.fn(),
        endSpan: jest.fn(),
      } as unknown as TracingService,
      searchClient,
      new VectorRepository(),
    );

    const result = await service.retrieveRelevantDocuments({
      tenantId: "tenant-a",
      question: "Where is the invoice?",
      queryEmbedding: [0.1, 0.2],
    });

    expect(result).toEqual([]);
    expect(searchClient.query).not.toHaveBeenCalled();
  });
});
