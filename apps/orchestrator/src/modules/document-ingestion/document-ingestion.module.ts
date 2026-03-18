import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import {
  LoggerModule,
  MetricsService,
  TracingModule,
} from "@rag-platform/observability";
import { InternalApiModule } from "../internal-api/internal-api.module";
import { DocumentChunkingService } from "./document-chunking.service";
import { DocumentEmbeddingService } from "./document-embedding.service";
import { DocumentIngestionConsumerService } from "./document-ingestion.consumer";
import { DocumentIngestionWorkerService } from "./document-ingestion.worker";
import { DocumentParserService } from "./document-parser.service";

@Module({
  imports: [ConfigModule, LoggerModule, TracingModule, InternalApiModule],
  providers: [
    MetricsService,
    DocumentChunkingService,
    DocumentEmbeddingService,
    DocumentParserService,
    DocumentIngestionWorkerService,
    DocumentIngestionConsumerService,
  ],
})
export class DocumentIngestionModule {}
