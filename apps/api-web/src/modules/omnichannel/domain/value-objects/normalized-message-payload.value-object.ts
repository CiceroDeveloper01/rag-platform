import { MessageChannel } from '../enums/message-channel.enum';

export interface NormalizedMessagePayloadProps {
  channel: MessageChannel;
  body: string;
  normalizedText: string;
  externalMessageId?: string | null;
  conversationId?: string | null;
  senderId?: string | null;
  senderName?: string | null;
  senderAddress?: string | null;
  recipientAddress?: string | null;
  subject?: string | null;
  metadata?: Record<string, unknown> | null;
}

export class NormalizedMessagePayload {
  constructor(private readonly props: NormalizedMessagePayloadProps) {
    if (!props.body.trim()) {
      throw new Error('Message body cannot be empty');
    }
  }

  toObject(): NormalizedMessagePayloadProps {
    return this.props;
  }
}
