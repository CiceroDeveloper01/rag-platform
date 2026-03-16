import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ReplyConversationDto } from '../dto/reply-conversation.dto';

@Injectable()
export class InternalConversationsService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(InternalConversationsService.name);
  }

  async reply(dto: ReplyConversationDto) {
    this.logger.info(
      {
        tenantId: dto.tenantId,
        channel: dto.channel,
        externalMessageId: dto.externalMessageId,
      },
      'Internal conversation reply accepted',
    );

    return {
      success: true as const,
      conversationId:
        typeof dto.metadata?.conversationId === 'number'
          ? dto.metadata.conversationId
          : undefined,
    };
  }
}
