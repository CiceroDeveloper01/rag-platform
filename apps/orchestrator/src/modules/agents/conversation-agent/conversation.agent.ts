import { Injectable } from "@nestjs/common";
import { ChannelMessageEvent } from "@rag-platform/contracts";
import { AppLoggerService } from "@rag-platform/observability";
import { ConversationMemoryService } from "../../memory/conversation-memory.service";
import { MemoryContextBuilder } from "../../memory/memory-context.builder";
import { ContextBuilderService } from "../../rag/context-builder.service";
import { DocumentIndexerService } from "../../rag/document-indexer.service";
import { EXECUTE_REPLY_CONVERSATION_JOB } from "../../queue/queue.constants";
import { FlowExecutionPayload } from "../../queue/flow-execution.types";
import { RetrieveDocumentsToolService } from "../../tools/retrieve-documents.tool";
import { FlowExecutionRequest } from "../document-agent/document.agent";
import { LanguageDetectionService } from "../language-detection.service";
import { AgentDecision } from "../supervisor/supervisor.agent";

@Injectable()
export class ConversationAgent {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly documentIndexerService: DocumentIndexerService,
    private readonly retrieveDocumentsToolService: RetrieveDocumentsToolService,
    private readonly contextBuilderService: ContextBuilderService,
    private readonly conversationMemoryService: ConversationMemoryService,
    private readonly memoryContextBuilder: MemoryContextBuilder,
    private readonly languageDetectionService: LanguageDetectionService,
  ) {}

  async plan(
    message: ChannelMessageEvent,
    decision: AgentDecision,
  ): Promise<FlowExecutionRequest> {
    const conversationId = message.conversationId ?? message.externalMessageId;
    const tenantId =
      typeof message.metadata?.tenantId === "string"
        ? message.metadata.tenantId
        : "default-tenant";
    const queryEmbedding = this.documentIndexerService.createQueryEmbedding(
      message.body,
    );
    await this.conversationMemoryService.storeMessage({
      tenantId,
      channel: String(message.channel),
      conversationId,
      role: "user",
      message: message.body,
      metadata: {
        externalMessageId: message.externalMessageId,
      },
    });

    const { recentMessages, semanticMemories } =
      await this.conversationMemoryService.getConversationContext({
        tenantId,
        channel: String(message.channel),
        conversationId,
        queryEmbedding,
      });
    const retrievedDocuments = await this.retrieveDocumentsToolService.execute({
      tenantId,
      question: message.body,
      queryEmbedding,
    });
    const detectedLanguage = decision.detectedLanguage;
    const ragContext = this.contextBuilderService.buildContext(
      message.body,
      retrievedDocuments,
      detectedLanguage,
    );
    const memoryContext = this.memoryContextBuilder.buildContext({
      recentMessages,
      semanticMemories,
      userQuestion: message.body,
      language: detectedLanguage,
    });
    const languageInstruction =
      this.languageDetectionService.getResponseInstruction(detectedLanguage);

    this.logger.log("Conversation agent selected", ConversationAgent.name, {
      externalMessageId: message.externalMessageId,
      channel: message.channel,
      recentMessages: recentMessages.length,
      semanticMemories: semanticMemories.length,
      retrievedDocuments: retrievedDocuments.length,
    });

    const payload: FlowExecutionPayload = {
      channel: message.channel,
      externalMessageId: message.externalMessageId,
      context: {
        decision,
        from: message.from,
        subject: message.subject,
        body: message.body,
        conversationId,
        queryEmbedding,
        recentMessages: recentMessages.map((memory) => ({
          id: memory.id,
          role: memory.role,
          message: memory.message,
          createdAt: memory.createdAt,
        })),
        semanticMemories: semanticMemories.map((memory) => ({
          id: memory.id,
          role: memory.role,
          message: memory.message,
          createdAt: memory.createdAt,
        })),
        retrievedDocuments: retrievedDocuments.map((document) => ({
          id: document.id,
          source: document.source,
          content: document.content,
          createdAt: document.createdAt,
        })),
        detectedLanguage,
        language: detectedLanguage,
        languageConfidence: decision.languageConfidence,
        languageUsedFallback: decision.languageUsedFallback,
        languageInstruction,
        ragContext,
        memoryContext,
        llmContext: [languageInstruction, memoryContext, ragContext].join(
          "\n\n",
        ),
        metadata: {
          ...(message.metadata ?? {}),
          tenantId,
        },
        receivedAt: message.receivedAt,
      },
    };

    return {
      jobName: EXECUTE_REPLY_CONVERSATION_JOB,
      payload,
    };
  }
}
