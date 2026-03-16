import { Module } from "@nestjs/common";
import {
  LoggerModule,
  MetricsService,
  TracingModule,
} from "@rag-platform/observability";
import { RagModule } from "../rag/rag.module";
import { ChunkDocumentToolService } from "./document-ingestion/chunk-document.tool";
import { DocumentIngestionPipelineService } from "./document-ingestion/document-ingestion.pipeline";
import { DownloadFileToolService } from "./document-ingestion/download-file.tool";
import { GenerateEmbeddingsToolService } from "./document-ingestion/generate-embeddings.tool";
import { IndexDocumentToolService } from "./document-ingestion/index-document.tool";
import { ParseDocumentToolService } from "./document-ingestion/parse-document.tool";
import { StoreDocumentToolService } from "./document-ingestion/store-document.tool";
import { RetrieveDocumentsToolService } from "./retrieval/retrieve-documents.tool";

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
