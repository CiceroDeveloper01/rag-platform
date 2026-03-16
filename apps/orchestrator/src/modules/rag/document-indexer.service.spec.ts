import {
  AppLoggerService,
  MetricsService,
  TracingService,
} from "@rag-platform/observability";
import { DocumentsInternalClient } from "@rag-platform/sdk";
import { DocumentIndexerService } from "./document-indexer.service";
import { VectorRepository } from "./vector.repository";

describe("DocumentIndexerService", () => {
  it("persists documents through the internal api and mirrors them locally", async () => {
    const logger = {
      debug: jest.fn(),
      error: jest.fn(),
    } as unknown as AppLoggerService;
    const metrics = {
      increment: jest.fn(),
      record: jest.fn(),
    } as unknown as MetricsService;
    const tracing = {
      startSpan: jest
        .fn()
        .mockReturnValue({ name: "rag.document.index", startedAt: "now" }),
      endSpan: jest.fn(),
    } as unknown as TracingService;
    const documentsClient = {
      registerDocument: jest
        .fn()
        .mockResolvedValue({ success: true, documentId: 42 }),
    } as unknown as DocumentsInternalClient;
    const repository = new VectorRepository();

    const service = new DocumentIndexerService(
      logger,
      metrics,
      tracing,
      documentsClient,
      repository,
    );

    const result = await service.indexDocument(
      "Billing policy content",
      "training:policy",
      {
        tenantId: "tenant-a",
      },
    );

    expect(documentsClient.registerDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-a",
        source: "training:policy",
        content: "Billing policy content",
      }),
    );
    expect(result.id).toBe("42");
    expect(repository.count()).toBe(1);
    expect(metrics.increment).toHaveBeenCalledWith("rag_document_index_total");
  });

  it("indexes attachments using provider metadata and records failures", async () => {
    const logger = {
      debug: jest.fn(),
      error: jest.fn(),
    } as unknown as AppLoggerService;
    const metrics = {
      increment: jest.fn(),
      record: jest.fn(),
    } as unknown as MetricsService;
    const tracing = {
      startSpan: jest
        .fn()
        .mockReturnValue({ name: "rag.document.index", startedAt: "now" }),
      endSpan: jest.fn(),
    } as unknown as TracingService;
    const documentsClient = {
      registerDocument: jest
        .fn()
        .mockResolvedValueOnce({ success: true, documentId: "attachment-1" })
        .mockRejectedValueOnce(new Error("persist failed")),
    } as unknown as DocumentsInternalClient;
    const repository = new VectorRepository();

    const service = new DocumentIndexerService(
      logger,
      metrics,
      tracing,
      documentsClient,
      repository,
    );

    const attachmentResult = await service.indexAttachment({
      providerFileId: "provider-file-1",
      fileName: "invoice.pdf",
      mimeType: "application/pdf",
      extractedText: "Invoice body",
    });

    expect(attachmentResult.id).toBe("attachment-1");

    await expect(
      service.indexDocument("failing content", "training:policy"),
    ).rejects.toThrow("persist failed");
    expect(metrics.increment).toHaveBeenCalledWith(
      "rag_document_index_failure_total",
    );
  });
});
