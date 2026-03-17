import { Injectable } from '@nestjs/common';
import type {
  EmailProvider,
  EmailProviderHealth,
  InboundEmailMessage,
  SendEmailRequest,
  SendEmailResult,
} from '../interfaces/email-provider.interface';

@Injectable()
export class MockProvider implements EmailProvider {
  async receive(): Promise<InboundEmailMessage[]> {
    return [];
  }

  async send(payload: SendEmailRequest): Promise<SendEmailResult> {
    return {
      accepted: true,
      externalId: `mock-${Date.now()}`,
      metadata: {
        to: payload.to,
      },
    };
  }

  async health(): Promise<EmailProviderHealth> {
    return {
      status: 'up',
      provider: 'mock',
    };
  }
}
