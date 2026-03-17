import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InternalConversationsService } from './internal-conversations.service';
import { ReplyConversationDto } from './reply-conversation.dto';

@ApiExcludeController()
@Controller(['conversations', 'api/v1/internal/conversations'])
export class InternalConversationsController {
  constructor(
    private readonly internalConversationsService: InternalConversationsService,
  ) {}

  @Post('reply')
  reply(@Body() dto: ReplyConversationDto) {
    return this.internalConversationsService.reply(dto);
  }
}
