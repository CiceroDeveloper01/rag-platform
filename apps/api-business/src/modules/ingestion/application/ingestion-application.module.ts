import { Module } from '@nestjs/common';
import { FileValidationService } from '../../../common/validation/file-validation.service';
import { MessagingModule } from '../../../common/messaging/messaging.module';
import { ObservabilityModule } from '../../../infra/observability/observability.module';
import { IngestionInfrastructureModule } from '../infrastructure/ingestion-infrastructure.module';
import { DocumentStatusMapper } from '../mappers/document-status.mapper';
import { IngestionService } from '../services/ingestion.service';
import { SourcesService } from '../services/sources.service';

@Module({
  imports: [
    MessagingModule,
    ObservabilityModule,
    IngestionInfrastructureModule,
  ],
  providers: [
    FileValidationService,
    IngestionService,
    SourcesService,
    DocumentStatusMapper,
  ],
  exports: [IngestionService, SourcesService, DocumentStatusMapper],
})
export class IngestionApplicationModule {}
