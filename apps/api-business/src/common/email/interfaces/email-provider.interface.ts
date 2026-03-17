export interface InboundEmailMessage {
  provider?: string;
  externalMessageId?: string;
  conversationId?: string;
  fromName?: string;
  fromEmail: string;
  toEmail: string;
  subject?: string;
  body: string;
  html?: string;
  metadata?: Record<string, unknown>;
}

export interface SendEmailRequest {
  to: string;
  from?: string;
  subject?: string;
  text: string;
  html?: string;
  metadata?: Record<string, string>;
}

export interface SendEmailResult {
  accepted: boolean;
  externalId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface EmailProviderHealth {
  status: 'up' | 'down' | 'disabled';
  provider: string;
  details?: Record<string, unknown>;
}

export interface EmailProvider {
  receive(): Promise<InboundEmailMessage[]>;
  send(payload: SendEmailRequest): Promise<SendEmailResult>;
  health(): Promise<EmailProviderHealth>;
}
