import { Injectable } from '@nestjs/common';
import type { InboundEmailMessage } from '../../../../common/email/interfaces/email-provider.interface';
import { EmailInboundDevDto } from '../../application/dto/email-inbound-dev.dto';

@Injectable()
export class DevEmailInboundProvider {
  createPayload(dto: EmailInboundDevDto): InboundEmailMessage {
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
