import { AttachmentPayload } from "@rag-platform/contracts";

export interface EmailInboundPayload {
  externalMessageId: string;
  fromEmail: string;
  fromName?: string;
  toEmail?: string;
  subject?: string;
  body: string;
  conversationId?: string;
  receivedAt?: string;
  attachments?: AttachmentPayload[];
  metadata?: Record<string, unknown>;
}

export interface EmailOutboundPayload {
  to: string;
  subject: string;
  text: string;
  metadata?: Record<string, unknown>;
}
