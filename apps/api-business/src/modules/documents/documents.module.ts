import { Module } from '@nestjs/common';
import { DocumentsApplicationModule } from './application/documents-application.module';
import { DocumentsController } from './controllers/documents.controller';
import { DocumentsInfrastructureModule } from './infrastructure/documents-infrastructure.module';

@Module({
  imports: [DocumentsApplicationModule, DocumentsInfrastructureModule],
  controllers: [DocumentsController],
  exports: [DocumentsApplicationModule, DocumentsInfrastructureModule],
})
export class DocumentsModule {}
