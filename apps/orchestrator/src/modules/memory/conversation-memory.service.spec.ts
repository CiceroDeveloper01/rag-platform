import {
  AppLoggerService,
  MetricsService,
  TracingService,
} from "@rag-platform/observability";
import { MemoryInternalClient } from "@rag-platform/sdk";
import { DocumentIndexerService } from "../rag/document-indexer.service";
import { ConversationMemoryService } from "./conversation-memory.service";

describe("ConversationMemoryService", () => {
  it("stores messages through the internal api with tenant and channel scope", async () => {
    const logger = { debug: jest.fn() } as unknown as AppLoggerService;
    const metrics = { increment: jest.fn() } as unknown as MetricsService;
    const tracing = {
      startSpan: jest
        .fn()
        .mockReturnValue({ name: "memory.store_message", startedAt: "now" }),
      endSpan: jest.fn(),
    } as unknown as TracingService;
    const memoryClient = {
      storeMessage: jest
        .fn()
        .mockResolvedValue({ success: true, memoryId: 99 }),
      queryContext: jest.fn(),
    } as unknown as MemoryInternalClient;
    const indexer = {
      createQueryEmbedding: jest.fn().mockReturnValue([0.1, 0.2]),
    } as unknown as DocumentIndexerService;

    const service = new ConversationMemoryService(
      { get: jest.fn().mockReturnValue(true) } as any,
      logger,
      metrics,
      tracing,
      memoryClient,
      indexer,
    );

    const result = await service.storeMessage({
      tenantId: "tenant-a",
      channel: "telegram",
      conversationId: "conv-1",
      role: "user",
      message: "Where is my invoice?",
    });

    expect(memoryClient.storeMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-a",
        channel: "telegram",
        conversationId: "conv-1",
      }),
    );
    expect(result.id).toBe("99");
  });

  it("retrieves recent and semantic context in a single scoped call", async () => {
    const logger = { debug: jest.fn() } as unknown as AppLoggerService;
    const metrics = { increment: jest.fn() } as unknown as MetricsService;
    const tracing = {
      startSpan: jest
        .fn()
        .mockReturnValue({ name: "memory.query_context", startedAt: "now" }),
      endSpan: jest.fn(),
    } as unknown as TracingService;
    const memoryClient = {
      storeMessage: jest.fn(),
      queryContext: jest.fn().mockResolvedValue({
        recentMessages: [
          {
            id: 1,
            tenantId: "tenant-a",
            channel: "telegram",
            conversationId: "conv-1",
            role: "user",
            message: "hello",
            createdAt: "2026-03-15T10:00:00.000Z",
          },
        ],
        semanticMemories: [],
      }),
    } as unknown as MemoryInternalClient;
    const indexer = {
      createQueryEmbedding: jest.fn(),
    } as unknown as DocumentIndexerService;

    const service = new ConversationMemoryService(
      { get: jest.fn().mockReturnValue(true) } as any,
      logger,
      metrics,
      tracing,
      memoryClient,
      indexer,
    );

    const result = await service.getConversationContext({
      tenantId: "tenant-a",
      channel: "telegram",
      conversationId: "conv-1",
      queryEmbedding: [0.1, 0.2],
    });

    expect(memoryClient.queryContext).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-a",
        channel: "telegram",
        conversationId: "conv-1",
      }),
    );
    expect(result.recentMessages).toHaveLength(1);
  });

  it("returns a safe local record when conversation memory is disabled", async () => {
    const memoryClient = {
      storeMessage: jest.fn(),
      queryContext: jest.fn(),
    } as unknown as MemoryInternalClient;
    const service = new ConversationMemoryService(
      {
        get: jest.fn((key: string, fallback?: unknown) =>
          key === "features.conversationMemoryEnabled" ? false : fallback,
        ),
      } as any,
      { debug: jest.fn(), warn: jest.fn() } as unknown as AppLoggerService,
      { increment: jest.fn() } as unknown as MetricsService,
      {
        startSpan: jest.fn(),
        endSpan: jest.fn(),
      } as unknown as TracingService,
      memoryClient,
      { createQueryEmbedding: jest.fn() } as unknown as DocumentIndexerService,
    );

    const result = await service.storeMessage({
      tenantId: "tenant-a",
      channel: "telegram",
      conversationId: "conv-1",
      role: "assistant",
      message: "fallback",
    });

    expect(result.id).toContain("conv-1:assistant");
    expect(memoryClient.storeMessage).not.toHaveBeenCalled();
  });

  it("returns empty context when conversation memory is disabled", async () => {
    const memoryClient = {
      storeMessage: jest.fn(),
      queryContext: jest.fn(),
    } as unknown as MemoryInternalClient;
    const service = new ConversationMemoryService(
      {
        get: jest.fn((key: string, fallback?: unknown) =>
          key === "features.conversationMemoryEnabled" ? false : fallback,
        ),
      } as any,
      { debug: jest.fn(), warn: jest.fn() } as unknown as AppLoggerService,
      { increment: jest.fn() } as unknown as MetricsService,
      {
        startSpan: jest.fn(),
        endSpan: jest.fn(),
      } as unknown as TracingService,
      memoryClient,
      { createQueryEmbedding: jest.fn() } as unknown as DocumentIndexerService,
    );

    const result = await service.getConversationContext({
      tenantId: "tenant-a",
      channel: "telegram",
      conversationId: "conv-1",
      queryEmbedding: [0.1],
    });

    expect(result).toEqual({
      recentMessages: [],
      semanticMemories: [],
    });
    expect(memoryClient.queryContext).not.toHaveBeenCalled();
  });
});
