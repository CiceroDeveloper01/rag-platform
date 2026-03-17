import { Module } from '@nestjs/common';
import { DOCUMENTS_REPOSITORY } from '../interfaces/documents-repository.interface';
import { DocumentsPostgresRepository } from '../repositories/documents-postgres.repository';

@Module({
  providers: [
    DocumentsPostgresRepository,
    {
      provide: DOCUMENTS_REPOSITORY,
      useExisting: DocumentsPostgresRepository,
    },
  ],
  exports: [DocumentsPostgresRepository, DOCUMENTS_REPOSITORY],
})
export class DocumentsInfrastructureModule {}
