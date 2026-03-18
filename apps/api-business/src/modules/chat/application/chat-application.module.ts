import { Module } from '@nestjs/common';
import { TenantContextService } from '../../../common/tenancy/tenant-context.service';
import { ObservabilityModule } from '../../../infra/observability/observability.module';
import { ConversationsModule } from '../../conversations/conversations.module';
import { DocumentsModule } from '../../documents/documents.module';
import { SearchModule } from '../../search/search.module';
import { ChatInfrastructureModule } from '../infrastructure/chat-infrastructure.module';
import { ChatResponseMapper } from '../mappers/chat-response.mapper';
import { ChatService } from '../services/chat.service';

@Module({
  imports: [
    SearchModule,
    DocumentsModule,
    ObservabilityModule,
    ConversationsModule,
    ChatInfrastructureModule,
  ],
  providers: [ChatService, ChatResponseMapper, TenantContextService],
  exports: [ChatService, ChatResponseMapper, TenantContextService],
})
export class ChatApplicationModule {}
