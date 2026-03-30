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
import { BlockCardToolService } from "./banking/block-card.tool";
import { CreateNegotiationProposalToolService } from "./banking/create-negotiation-proposal.tool";
import { GetAccountsToolService } from "./banking/get-accounts.tool";
import { GetCardsToolService } from "./banking/get-cards.tool";
import { GetCustomerProfileToolService } from "./banking/get-customer-profile.tool";
import { GetDebtStatusToolService } from "./banking/get-debt-status.tool";
import { GetInvestmentProductsToolService } from "./banking/get-investment-products.tool";
import { GetInvoiceToolService } from "./banking/get-invoice.tool";
import { SimulateInvestmentToolService } from "./banking/simulate-investment.tool";
import { SimulateLoanToolService } from "./banking/simulate-loan.tool";
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
    GetCustomerProfileToolService,
    GetAccountsToolService,
    GetCardsToolService,
    BlockCardToolService,
    GetInvoiceToolService,
    SimulateLoanToolService,
    GetInvestmentProductsToolService,
    SimulateInvestmentToolService,
    GetDebtStatusToolService,
    CreateNegotiationProposalToolService,
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
    GetCustomerProfileToolService,
    GetAccountsToolService,
    GetCardsToolService,
    BlockCardToolService,
    GetInvoiceToolService,
    SimulateLoanToolService,
    GetInvestmentProductsToolService,
    SimulateInvestmentToolService,
    GetDebtStatusToolService,
    CreateNegotiationProposalToolService,
  ],
})
export class ToolsModule {}
