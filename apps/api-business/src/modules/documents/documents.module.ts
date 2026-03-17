import { Module } from '@nestjs/common';
import { TenantContextService } from '../../common/tenancy/tenant-context.service';
import { DocumentsController } from './controllers/documents.controller';
import { DocumentsPostgresRepository } from './repositories/documents-postgres.repository';
import { DocumentsService } from './services/documents.service';
import { DOCUMENTS_REPOSITORY } from './interfaces/documents-repository.interface';

@Module({
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    TenantContextService,
    DocumentsPostgresRepository,
    {
      provide: DOCUMENTS_REPOSITORY,
      useExisting: DocumentsPostgresRepository,
    },
  ],
  exports: [DocumentsService, DOCUMENTS_REPOSITORY],
})
export class DocumentsModule {}
