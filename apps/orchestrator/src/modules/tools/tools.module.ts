import { Module } from "@nestjs/common";
import {
  LoggerModule,
  MetricsService,
  TracingModule,
} from "@rag-platform/observability";
import { RagModule } from "../rag/rag.module";
import { ChunkDocumentToolService } from "./chunk-document.tool";
import { DocumentIngestionPipelineService } from "./document-ingestion.pipeline";
import { DownloadFileToolService } from "./download-file.tool";
import { GenerateEmbeddingsToolService } from "./generate-embeddings.tool";
import { IndexDocumentToolService } from "./index-document.tool";
import { ParseDocumentToolService } from "./parse-document.tool";
import { RetrieveDocumentsToolService } from "./retrieve-documents.tool";
import { StoreDocumentToolService } from "./store-document.tool";

@Module({
  imports: [LoggerModule, TracingModule, RagModule],
  providers: [
    MetricsService,
    DownloadFileToolService,
    ParseDocumentToolService,
    ChunkDocumentToolService,
    GenerateEmbeddingsToolService,
    StoreDocumentToolService,
    IndexDocumentToolService,
    RetrieveDocumentsToolService,
    DocumentIngestionPipelineService,
  ],
  exports: [
    DownloadFileToolService,
    ParseDocumentToolService,
    ChunkDocumentToolService,
    GenerateEmbeddingsToolService,
    StoreDocumentToolService,
    IndexDocumentToolService,
    RetrieveDocumentsToolService,
    DocumentIngestionPipelineService,
  ],
})
export class ToolsModule {}
