import { Injectable } from '@nestjs/common';
import type { InboundEmailMessage } from '../../../../common/email/interfaces/email-provider.interface';
import { EmailInboundDevRequest } from '../../application/dtos/request/email-inbound-dev.request';

@Injectable()
export class DevEmailInboundProvider {
  createPayload(dto: EmailInboundDevRequest): InboundEmailMessage {
    return {
      provider: 'dev',
      fromName: dto.fromName,
      fromEmail: dto.fromEmail,
      toEmail: dto.toEmail,
      subject: dto.subject,
      body: dto.body,
      externalMessageId: dto.externalMessageId,
      conversationId: dto.conversationId,
      metadata: dto.metadata,
    };
  }
}
