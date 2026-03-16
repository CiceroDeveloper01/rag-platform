import { AppLoggerService } from "@rag-platform/observability";
import { ConversationMemoryService } from "../../memory/conversation-memory.service";
import { MemoryContextBuilder } from "../../memory/memory-context.builder";
import { ContextBuilderService } from "../../rag/context-builder.service";
import { DocumentIndexerService } from "../../rag/document-indexer.service";
import { RetrieveDocumentsToolService } from "../../tools/retrieval/retrieve-documents.tool";
import { LanguageDetectionService } from "../language-detection.service";
import { ConversationAgent } from "./conversation.agent";

describe("ConversationAgent", () => {
  it("propagates english language instructions into the execution context", async () => {
    const logger = { log: jest.fn() } as unknown as AppLoggerService;
    const documentIndexerService = {
      createQueryEmbedding: jest.fn().mockReturnValue([0.1, 0.2]),
    } as unknown as DocumentIndexerService;
    const retrieveDocumentsToolService = {
      execute: jest.fn().mockResolvedValue([]),
    } as unknown as RetrieveDocumentsToolService;
    const contextBuilderService = new ContextBuilderService();
    const conversationMemoryService = {
      storeMessage: jest.fn().mockResolvedValue(undefined),
      getConversationContext: jest.fn().mockResolvedValue({
        recentMessages: [],
        semanticMemories: [],
      }),
    } as unknown as ConversationMemoryService;
    const memoryContextBuilder = new MemoryContextBuilder();
    const languageDetectionService = new LanguageDetectionService();

    const agent = new ConversationAgent(
      logger,
      documentIndexerService,
      retrieveDocumentsToolService,
      contextBuilderService,
      conversationMemoryService,
      memoryContextBuilder,
      languageDetectionService,
    );

    const result = await agent.plan(
      {
        eventType: "message.received",
        channel: "email" as never,
        externalMessageId: "msg-1",
        from: "user@example.com",
        body: "Where is my invoice?",
        receivedAt: new Date().toISOString(),
        metadata: {
          tenantId: "tenant-a",
        },
      },
      {
        intent: "reply-conversation",
        confidence: 0.8,
        targetAgent: "conversation-agent",
        detectedLanguage: "en",
        languageConfidence: 0.91,
        languageUsedFallback: false,
      },
    );

    expect(result.payload.context).toMatchObject({
      detectedLanguage: "en",
      language: "en",
      languageUsedFallback: false,
    });
    expect(conversationMemoryService.storeMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-a",
        channel: "email",
        conversationId: "msg-1",
      }),
    );
    expect(result.payload.context?.llmContext).toContain(
      "You must answer in English",
    );
  });

  it("falls back to the external message id and default tenant when metadata is missing", async () => {
    const logger = { log: jest.fn() } as unknown as AppLoggerService;
    const documentIndexerService = {
      createQueryEmbedding: jest.fn().mockReturnValue([0.1, 0.2]),
    } as unknown as DocumentIndexerService;
    const retrieveDocumentsToolService = {
      execute: jest.fn().mockResolvedValue([]),
    } as unknown as RetrieveDocumentsToolService;
    const contextBuilderService = new ContextBuilderService();
    const conversationMemoryService = {
      storeMessage: jest.fn().mockResolvedValue(undefined),
      getConversationContext: jest.fn().mockResolvedValue({
        recentMessages: [],
        semanticMemories: [],
      }),
    } as unknown as ConversationMemoryService;
    const memoryContextBuilder = new MemoryContextBuilder();
    const languageDetectionService = new LanguageDetectionService();

    const agent = new ConversationAgent(
      logger,
      documentIndexerService,
      retrieveDocumentsToolService,
      contextBuilderService,
      conversationMemoryService,
      memoryContextBuilder,
      languageDetectionService,
    );

    const result = await agent.plan(
      {
        eventType: "message.received",
        channel: "telegram" as never,
        externalMessageId: "msg-2",
        from: "ada",
        body: "ola",
        receivedAt: new Date().toISOString(),
      },
      {
        intent: "reply-conversation",
        confidence: 0.7,
        targetAgent: "conversation-agent",
        detectedLanguage: "pt",
        languageConfidence: 0.7,
        languageUsedFallback: true,
      },
    );

    expect(conversationMemoryService.storeMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "default-tenant",
        conversationId: "msg-2",
      }),
    );
    expect(result.payload.context).toMatchObject({
      conversationId: "msg-2",
      language: "pt",
      languageUsedFallback: true,
    });
  });
});
