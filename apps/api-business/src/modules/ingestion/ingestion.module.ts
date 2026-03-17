import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessagingModule } from '../../common/messaging/messaging.module';
import { FileValidationService } from '../../common/validation/file-validation.service';
import { ChunkingService } from '../../infra/chunking/chunking.service';
import { ObservabilityModule } from '../../infra/observability/observability.module';
import { DocxParserService } from '../../infra/parsing/docx-parser.service';
import { PdfParserService } from '../../infra/parsing/pdf-parser.service';
import { TextParserService } from '../../infra/parsing/text-parser.service';
import { DocumentsModule } from '../documents/documents.module';
import { IngestionController } from './controllers/ingestion.controller';
import { SourcesController } from './controllers/sources.controller';
import { SOURCE_REPOSITORY } from './interfaces/source-repository.interface';
import { SourcePostgresRepository } from './repositories/source-postgres.repository';
import { IngestionService } from './services/ingestion.service';
import { SourcesService } from './services/sources.service';

@Module({
  imports: [ConfigModule, DocumentsModule, ObservabilityModule, MessagingModule],
  controllers: [IngestionController, SourcesController],
  providers: [
    IngestionService,
    SourcesService,
    PdfParserService,
    TextParserService,
    DocxParserService,
    ChunkingService,
    FileValidationService,
    SourcePostgresRepository,
    {
      provide: SOURCE_REPOSITORY,
      useExisting: SourcePostgresRepository,
    },
  ],
  exports: [ChunkingService, SOURCE_REPOSITORY],
})
export class IngestionModule {}
