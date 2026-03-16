import { Module } from '@nestjs/common';
import { TenantContextService } from '../../common/tenancy/tenant-context.service';
import { ObservabilityModule } from '../../infra/observability/observability.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { DocumentsModule } from '../documents/documents.module';
import { SearchModule } from '../search/search.module';
import { ChatController } from './controllers/chat.controller';
import { QUERY_REPOSITORY } from './interfaces/query-repository.interface';
import { QueryPostgresRepository } from './repositories/query-postgres.repository';
import { ChatService } from './services/chat.service';

@Module({
  imports: [
    SearchModule,
    DocumentsModule,
    ObservabilityModule,
    ConversationsModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    TenantContextService,
    QueryPostgresRepository,
    {
      provide: QUERY_REPOSITORY,
      useExisting: QueryPostgresRepository,
    },
  ],
})
export class ChatModule {}
