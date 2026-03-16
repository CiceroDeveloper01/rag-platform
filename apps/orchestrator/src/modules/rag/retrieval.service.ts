import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AppLoggerService,
  MetricsService,
  RAG_RETRIEVAL_FAILURE_TOTAL,
  RAG_RETRIEVAL_TOTAL,
  TracingService,
} from "@rag-platform/observability";
import { RagSearchInternalClient } from "@rag-platform/sdk";
import { RagDocumentRecord, VectorRepository } from "./vector.repository";

@Injectable()
export class RetrievalService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
    private readonly metricsService: MetricsService,
    private readonly tracingService: TracingService,
    private readonly ragSearchInternalClient: RagSearchInternalClient,
    private readonly vectorRepository: VectorRepository,
  ) {}

  async retrieveRelevantDocuments(payload: {
    tenantId: string;
    question: string;
    queryEmbedding?: number[];
    limit?: number;
  }): Promise<RagDocumentRecord[]> {
    if (!this.isRetrievalEnabled()) {
      this.metricsService.increment("rag_retrieval_skipped_total");
      this.logger.warn(
        "RAG retrieval skipped because the feature toggle is disabled",
        RetrievalService.name,
        {
          tenantId: payload.tenantId,
          question: payload.question,
        },
      );

      return [];
    }

    const topK =
      payload.limit ?? this.configService.get<number>("rag.topK", 5) ?? 5;
    const trace = this.tracingService.startSpan("rag.retrieval.query");
    const startedAt = Date.now();

    try {
      const response = await this.ragSearchInternalClient.query({
        tenantId: payload.tenantId,
        question: payload.question,
        topK,
      });
      const documents = response.contexts.map((context) => ({
        id: String(context.id),
        content: context.content,
        source:
          context.source ??
          (typeof context.metadata?.source === "string"
            ? context.metadata.source
            : `document:${context.id}`),
        embedding: [],
        createdAt: context.createdAt ?? new Date().toISOString(),
      }));

      this.metricsService.increment(RAG_RETRIEVAL_TOTAL);
      this.metricsService.record(
        "rag_retrieval_duration_ms",
        Date.now() - startedAt,
      );
      this.metricsService.record(
        "rag_retrieval_results_count",
        documents.length,
      );
      this.tracingService.endSpan(trace);

      this.logger.debug("RAG retrieval completed", RetrievalService.name, {
        retrievedDocuments: documents.length,
        topK,
      });

      return documents;
    } catch (error) {
      this.metricsService.increment(RAG_RETRIEVAL_FAILURE_TOTAL);
      this.tracingService.endSpan(trace);

      this.logger.warn(
        "RAG retrieval failed, evaluating local fallback",
        RetrievalService.name,
        {
          topK,
          tenantId: payload.tenantId,
          reason: error instanceof Error ? error.message : "unknown_error",
        },
      );

      if (!payload.queryEmbedding) {
        throw error;
      }

      const fallbackDocuments = this.vectorRepository.findSimilar(
        payload.queryEmbedding,
        topK,
      );

      return fallbackDocuments;
    }
  }

  private isRetrievalEnabled(): boolean {
    return (
      this.configService.get<boolean>("features.ragRetrievalEnabled", true) ??
      true
    );
  }
}
