import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AppLoggerService,
  MetricsService,
  TracingService,
} from "@rag-platform/observability";
import { MemoryInternalClient } from "@rag-platform/sdk";
import { DocumentIndexerService } from "../rag/document-indexer.service";
import { ConversationMemoryRecord } from "./memory.repository";

@Injectable()
export class ConversationMemoryService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
    private readonly metricsService: MetricsService,
    private readonly tracingService: TracingService,
    private readonly memoryInternalClient: MemoryInternalClient,
    private readonly documentIndexerService: DocumentIndexerService,
  ) {}

  async storeMessage(params: {
    tenantId: string;
    channel: string;
    conversationId: string;
    role: "user" | "assistant" | "system";
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<ConversationMemoryRecord> {
    const content = params.message.trim();
    if (!this.isConversationMemoryEnabled()) {
      this.metricsService.increment("conversation_memory_skipped_total");
      this.logger.warn(
        "Conversation memory skipped because the feature toggle is disabled",
        ConversationMemoryService.name,
        {
          tenantId: params.tenantId,
          channel: params.channel,
          conversationId: params.conversationId,
          role: params.role,
        },
      );

      return {
        id: this.createMemoryId(params.conversationId, params.role, content),
        tenantId: params.tenantId,
        channel: params.channel,
        conversationId: params.conversationId,
        role: params.role,
        message: content,
        createdAt: new Date().toISOString(),
        metadata: params.metadata ?? null,
      };
    }

    const trace = this.tracingService.startSpan("memory.store_message");
    const createdAt = new Date().toISOString();
    const response = await this.memoryInternalClient.storeMessage({
      tenantId: params.tenantId,
      channel: params.channel,
      conversationId: params.conversationId,
      role: params.role,
      message: content,
      embedding: this.documentIndexerService.createQueryEmbedding(content),
      metadata: params.metadata,
      createdAt,
    });
    this.tracingService.endSpan(trace);
    this.metricsService.increment("conversation_memory_store_total");

    const memory = {
      id: String(
        response.memoryId ??
          this.createMemoryId(params.conversationId, params.role, content),
      ),
      tenantId: params.tenantId,
      channel: params.channel,
      conversationId: params.conversationId,
      role: params.role,
      message: content,
      createdAt,
      metadata: params.metadata ?? null,
    };

    this.logger.debug(
      "Conversation memory stored",
      ConversationMemoryService.name,
      {
        tenantId: params.tenantId,
        channel: params.channel,
        conversationId: params.conversationId,
        role: params.role,
        memoryId: memory.id,
      },
    );

    return memory;
  }

  async getConversationContext(params: {
    tenantId: string;
    channel: string;
    conversationId: string;
    queryEmbedding: number[];
  }): Promise<{
    recentMessages: ConversationMemoryRecord[];
    semanticMemories: ConversationMemoryRecord[];
  }> {
    if (!this.isConversationMemoryEnabled()) {
      this.metricsService.increment("conversation_memory_query_skipped_total");
      this.logger.warn(
        "Conversation memory context skipped because the feature toggle is disabled",
        ConversationMemoryService.name,
        {
          tenantId: params.tenantId,
          channel: params.channel,
          conversationId: params.conversationId,
        },
      );

      return {
        recentMessages: [],
        semanticMemories: [],
      };
    }

    const trace = this.tracingService.startSpan("memory.query_context");
    const context = await this.memoryInternalClient.queryContext({
      tenantId: params.tenantId,
      channel: params.channel,
      conversationId: params.conversationId,
      queryEmbedding: params.queryEmbedding,
    });
    this.tracingService.endSpan(trace);
    this.metricsService.increment("conversation_memory_query_total");

    return {
      recentMessages: context.recentMessages,
      semanticMemories: context.semanticMemories,
    };
  }

  private createMemoryId(
    conversationId: string,
    role: "user" | "assistant" | "system",
    message: string,
  ): string {
    const normalized = `${conversationId}:${role}:${message}`.slice(0, 160);
    let hash = 0;

    for (let index = 0; index < normalized.length; index += 1) {
      hash = (hash * 33 + normalized.charCodeAt(index)) >>> 0;
    }

    return `${conversationId}:${role}:${hash.toString(16)}`;
  }

  private isConversationMemoryEnabled(): boolean {
    return (
      this.configService.get<boolean>(
        "features.conversationMemoryEnabled",
        true,
      ) ?? true
    );
  }
}
