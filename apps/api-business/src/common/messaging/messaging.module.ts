import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CommonObservabilityModule } from "../observability/observability.module";
import { DocumentIngestionPublisherService } from "./document-ingestion.publisher";

@Global()
@Module({
  imports: [ConfigModule, CommonObservabilityModule],
  providers: [DocumentIngestionPublisherService],
  exports: [DocumentIngestionPublisherService],
})
export class MessagingModule {}
