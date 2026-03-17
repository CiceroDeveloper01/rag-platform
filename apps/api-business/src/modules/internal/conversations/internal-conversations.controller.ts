import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InternalConversationsService } from './internal-conversations.service';
import { ReplyConversationRequest } from './dtos/request/reply-conversation.request';

@ApiExcludeController()
@Controller(['conversations', 'api/v1/internal/conversations'])
export class InternalConversationsController {
  constructor(
    private readonly internalConversationsService: InternalConversationsService,
  ) {}

  @Post('reply')
  reply(@Body() dto: ReplyConversationRequest) {
    return this.internalConversationsService.reply(dto);
  }
}
