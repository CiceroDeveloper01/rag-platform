import { Injectable } from '@nestjs/common';
import type { EmailInboundPayload } from '../adapters/channels/email/email.types';

export interface ParsedEmailPayload {
  externalMessageId?: string;
  conversationId: string;
  subject: string | null;
  body: string;
  senderName: string | null;
  senderAddress: string;
  recipientAddress: string;
  metadata: Record<string, unknown>;
}

@Injectable()
export class EmailParserService {
  parse(payload: EmailInboundPayload): ParsedEmailPayload {
    const body = payload.body.trim();
    const subject = payload.subject?.trim() || null;
    const conversationId =
      payload.conversationId?.trim() ||
      `${payload.fromEmail.trim().toLowerCase()}::${payload.toEmail.trim().toLowerCase()}`;

    return {
      externalMessageId: payload.externalMessageId?.trim() || undefined,
      conversationId,
      subject,
      body,
      senderName: payload.fromName?.trim() || null,
      senderAddress: payload.fromEmail.trim().toLowerCase(),
      recipientAddress: payload.toEmail.trim().toLowerCase(),
      metadata: {
        provider: payload.provider ?? 'dev',
        from: payload.fromEmail.trim().toLowerCase(),
        to: payload.toEmail.trim().toLowerCase(),
        subject,
        headers: {
          'x-dev-provider': 'rag-platform-dev-email',
        },
        ...(payload.metadata ?? {}),
      },
    };
  }
}
