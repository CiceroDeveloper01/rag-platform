import { Module } from '@nestjs/common';
import { TenantContextService } from '../../common/tenancy/tenant-context.service';
import { DocumentsModule } from '../documents/documents.module';
import { MemoryModule } from '../memory/memory.module';
import { InternalConversationsController } from './conversations/internal-conversations.controller';
import { InternalConversationsService } from './conversations/internal-conversations.service';
import { InternalDocumentsController } from './documents/internal-documents.controller';
import { InternalDocumentsService } from './documents/internal-documents.service';
import { InternalHandoffController } from './handoff/internal-handoff.controller';
import { InternalHandoffService } from './handoff/internal-handoff.service';
import { InternalMemoryController } from './memory/internal-memory.controller';
import { InternalMemoryService } from './memory/internal-memory.service';

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
