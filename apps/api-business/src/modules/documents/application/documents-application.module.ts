import { Module } from '@nestjs/common';
import { TenantContextService } from '../../../common/tenancy/tenant-context.service';
import { DocumentsInfrastructureModule } from '../infrastructure/documents-infrastructure.module';
import { DocumentResponseMapper } from '../mappers/document-response.mapper';
import { DocumentsService } from '../services/documents.service';

@Module({
  imports: [DocumentsInfrastructureModule],
  providers: [DocumentsService, DocumentResponseMapper, TenantContextService],
  exports: [DocumentsService, DocumentResponseMapper, TenantContextService],
})
export class DocumentsApplicationModule {}
