import { MessageChannel } from '../enums/message-channel.enum';
import { OmnichannelMessageStatus } from '../enums/omnichannel-message-status.enum';
import { OmnichannelMessage } from '../entities/omnichannel-message.entity';

export interface OmnichannelMessageFilters {
  limit: number;
  offset: number;
  channel?: MessageChannel;
  status?: OmnichannelMessageStatus;
}

export interface IMessageRepository {
  create(message: OmnichannelMessage): Promise<OmnichannelMessage>;
  updateStatus(
    messageId: number,
    status: OmnichannelMessageStatus,
    processedAt?: Date,
  ): Promise<void>;
  findById(messageId: number): Promise<OmnichannelMessage | null>;
  findMany(filters: OmnichannelMessageFilters): Promise<OmnichannelMessage[]>;
  getOverview(): Promise<{
    totalMessages: number;
    inboundMessages: number;
    outboundMessages: number;
    failedMessages: number;
  }>;
}

export const OMNICHANNEL_MESSAGE_REPOSITORY = Symbol(
  'OMNICHANNEL_MESSAGE_REPOSITORY',
);
