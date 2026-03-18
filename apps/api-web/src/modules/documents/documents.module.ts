import { Module } from '@nestjs/common';
import { DocumentsController } from './presentation/controllers/documents.controller';
import { IngestionController } from './presentation/controllers/ingestion.controller';
import { SourcesController } from './presentation/controllers/sources.controller';
import { DocumentsProxyService } from './application/services/documents-proxy.service';

@Module({
  controllers: [DocumentsController, IngestionController, SourcesController],
  providers: [DocumentsProxyService],
})
export class DocumentsModule {}
