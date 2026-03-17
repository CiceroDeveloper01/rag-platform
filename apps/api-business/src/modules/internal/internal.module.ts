import { Module } from '@nestjs/common';
import { TenantContextService } from '../../common/tenancy/tenant-context.service';
import { DocumentsModule } from '../documents/documents.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { MemoryModule } from '../memory/memory.module';
import { InternalConversationsController } from './conversations/internal-conversations.controller';
import { InternalConversationsService } from './conversations/internal-conversations.service';
import { InternalDocumentsController } from './documents/internal-documents.controller';
import { InternalDocumentsService } from './documents/internal-documents.service';
import { InternalHandoffController } from './handoff/internal-handoff.controller';
import { InternalHandoffService } from './handoff/internal-handoff.service';
import { InternalIngestionController } from './ingestion/internal-ingestion.controller';
import { InternalIngestionService } from './ingestion/internal-ingestion.service';
import { InternalMemoryController } from './memory/internal-memory.controller';
import { InternalMemoryService } from './memory/internal-memory.service';

@Module({
  imports: [DocumentsModule, IngestionModule, MemoryModule],
  controllers: [
    InternalDocumentsController,
    InternalConversationsController,
    InternalHandoffController,
    InternalIngestionController,
    InternalMemoryController,
  ],
  providers: [
    InternalDocumentsService,
    InternalConversationsService,
    InternalHandoffService,
    InternalIngestionService,
    InternalMemoryService,
    TenantContextService,
  ],
})
export class InternalModule {}
