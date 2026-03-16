import { Module } from "@nestjs/common";
import {
  LoggerModule,
  MetricsService,
  TracingModule,
} from "@rag-platform/observability";
import { InternalApiModule } from "../internal-api/internal-api.module";
import { ContextBuilderService } from "./context-builder.service";
import { DocumentIndexerService } from "./document-indexer.service";
import { RetrievalService } from "./retrieval.service";
import { VectorRepository } from "./vector.repository";

@Module({
  imports: [LoggerModule, TracingModule, InternalApiModule],
  providers: [
    MetricsService,
    VectorRepository,
    DocumentIndexerService,
    RetrievalService,
    ContextBuilderService,
  ],
  exports: [
    VectorRepository,
    DocumentIndexerService,
    RetrievalService,
    ContextBuilderService,
  ],
})
export class RagModule {}
