import { Channel } from "../enums/channel.enum";

export type MessageType = "text" | "document" | "command";

export interface DocumentPayload {
  providerFileId?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  storageKey?: string;
  extractedText?: string;
}

export interface AttachmentPayload {
  fileName: string;
  mimeType: string;
  storageKey?: string;
  providerFileId?: string;
  fileSize?: number;
  extractedText?: string;
}

export interface ChannelMessageEvent {
  eventType: string;
  channel: Channel;
  externalMessageId: string;
  conversationId?: string;
  from: string;
  userId?: string;
  chatId?: string;
  messageId?: string;
  messageType?: MessageType;
  text?: string;
  document?: DocumentPayload;
  subject?: string;
  body: string;
  attachments?: AttachmentPayload[];
  receivedAt: string;
  metadata?: Record<string, unknown>;
}
