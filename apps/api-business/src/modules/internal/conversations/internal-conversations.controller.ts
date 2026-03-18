import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InternalServiceAuthGuard } from '../../../common/auth/guards/internal-service-auth.guard';
import { ServiceScopesGuard } from '../../../common/auth/guards/service-scopes.guard';
import { ServiceScopes } from '../../../common/decorators/service-scopes.decorator';
import { InternalConversationsService } from './internal-conversations.service';
import { ReplyConversationRequest } from './dtos/request/reply-conversation.request';

@ApiExcludeController()
@Controller(['conversations', 'api/v1/internal/conversations'])
@UseGuards(InternalServiceAuthGuard, ServiceScopesGuard)
export class InternalConversationsController {
  constructor(
    private readonly internalConversationsService: InternalConversationsService,
  ) {}

  @Post('reply')
  @ServiceScopes('internal:conversations:write')
  reply(@Body() dto: ReplyConversationRequest) {
    return this.internalConversationsService.reply(dto);
  }
}
