import { Module } from '@nestjs/common';
import { TenantContextService } from '../../common/tenancy/tenant-context.service';
import { DocumentsModule } from '../documents/documents.module';
import { MemoryModule } from '../memory/memory.module';
import { InternalConversationsController } from './controllers/internal-conversations.controller';
import { InternalDocumentsController } from './controllers/internal-documents.controller';
import { InternalHandoffController } from './controllers/internal-handoff.controller';
import { InternalMemoryController } from './controllers/internal-memory.controller';
import { InternalConversationsService } from './services/internal-conversations.service';
import { InternalDocumentsService } from './services/internal-documents.service';
import { InternalHandoffService } from './services/internal-handoff.service';
import { InternalMemoryService } from './services/internal-memory.service';

@Module({
  imports: [DocumentsModule, MemoryModule],
  controllers: [
    InternalDocumentsController,
    InternalConversationsController,
    InternalHandoffController,
    InternalMemoryController,
  ],
  providers: [
    InternalDocumentsService,
    InternalConversationsService,
    InternalHandoffService,
    InternalMemoryService,
    TenantContextService,
  ],
})
export class InternalModule {}
