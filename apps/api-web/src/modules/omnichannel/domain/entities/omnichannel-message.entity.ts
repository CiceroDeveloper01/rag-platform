import { MessageChannel } from '../enums/message-channel.enum';
import { MessageDirection } from '../enums/message-direction.enum';
import { OmnichannelMessageStatus } from '../enums/omnichannel-message-status.enum';

export interface OmnichannelMessageProps {
  id?: number;
  externalMessageId?: string | null;
  conversationId?: string | null;
  channel: MessageChannel;
  direction: MessageDirection;
  senderId?: string | null;
  senderName?: string | null;
  senderAddress?: string | null;
  recipientAddress?: string | null;
  subject?: string | null;
  body: string;
  normalizedText: string;
  metadata?: Record<string, unknown> | null;
  status: OmnichannelMessageStatus;
  receivedAt: Date;
  processedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class OmnichannelMessage {
  constructor(private readonly props: OmnichannelMessageProps) {}

  static createInbound(
    props: Omit<
      OmnichannelMessageProps,
      'direction' | 'status' | 'receivedAt' | 'createdAt' | 'updatedAt'
    > & { receivedAt?: Date },
  ): OmnichannelMessage {
    const now = props.receivedAt ?? new Date();

    return new OmnichannelMessage({
      ...props,
      direction: MessageDirection.INBOUND,
      status: OmnichannelMessageStatus.RECEIVED,
      receivedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  static createOutbound(
    props: Omit<
      OmnichannelMessageProps,
      'direction' | 'status' | 'receivedAt' | 'createdAt' | 'updatedAt'
    > & { receivedAt?: Date },
  ): OmnichannelMessage {
    const now = props.receivedAt ?? new Date();

    return new OmnichannelMessage({
      ...props,
      direction: MessageDirection.OUTBOUND,
      status: OmnichannelMessageStatus.PROCESSED,
      receivedAt: now,
      processedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  markNormalized(at: Date): OmnichannelMessage {
    return this.clone({
      status: OmnichannelMessageStatus.NORMALIZED,
      updatedAt: at,
    });
  }

  markProcessing(at: Date): OmnichannelMessage {
    return this.clone({
      status: OmnichannelMessageStatus.PROCESSING,
      updatedAt: at,
    });
  }

  markProcessed(at: Date): OmnichannelMessage {
    return this.clone({
      status: OmnichannelMessageStatus.PROCESSED,
      processedAt: at,
      updatedAt: at,
    });
  }

  markFailed(at: Date): OmnichannelMessage {
    return this.clone({
      status: OmnichannelMessageStatus.FAILED,
      processedAt: at,
      updatedAt: at,
    });
  }

  markDispatched(at: Date): OmnichannelMessage {
    return this.clone({
      status: OmnichannelMessageStatus.DISPATCHED,
      processedAt: at,
      updatedAt: at,
    });
  }

  toObject(): OmnichannelMessageProps {
    return { ...this.props };
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get channel(): MessageChannel {
    return this.props.channel;
  }

  get normalizedText(): string {
    return this.props.normalizedText;
  }

  get body(): string {
    return this.props.body;
  }

  private clone(next: Partial<OmnichannelMessageProps>): OmnichannelMessage {
    return new OmnichannelMessage({
      ...this.props,
      ...next,
    });
  }
}
