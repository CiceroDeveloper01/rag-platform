import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ReplyConversationDto } from '../dto/reply-conversation.dto';
import { InternalConversationsService } from '../services/internal-conversations.service';

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
