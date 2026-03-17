import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ReplyConversationRequest } from './dtos/request/reply-conversation.request';

@Injectable()
export class InternalConversationsService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(InternalConversationsService.name);
  }

  async reply(dto: ReplyConversationRequest) {
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
