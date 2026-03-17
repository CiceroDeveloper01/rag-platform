import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../infra/database/database.service';
import { OmnichannelMessage } from '../../domain/entities/omnichannel-message.entity';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { MessageDirection } from '../../domain/enums/message-direction.enum';
import { OmnichannelMessageStatus } from '../../domain/enums/omnichannel-message-status.enum';
import {
  IMessageRepository,
  OmnichannelMessageFilters,
} from '../../domain/repositories/message-repository.interface';

interface MessageRow {
  id: number;
  external_message_id: string | null;
  conversation_id: string | null;
  channel: MessageChannel;
  direction: MessageDirection;
  sender_id: string | null;
  sender_name: string | null;
  sender_address: string | null;
  recipient_address: string | null;
  subject: string | null;
  body: string;
  normalized_text: string;
  metadata: Record<string, unknown> | null;
  status: OmnichannelMessageStatus;
  received_at: Date;
  processed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class OmnichannelMessagePostgresRepository implements IMessageRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(message: OmnichannelMessage): Promise<OmnichannelMessage> {
    const payload = message.toObject();
    const [row] = await this.databaseService.query<MessageRow>(
      `
        INSERT INTO omnichannel_messages (
          external_message_id,
          conversation_id,
          channel,
          direction,
          sender_id,
          sender_name,
          sender_address,
          recipient_address,
          subject,
          body,
          normalized_text,
          metadata,
          status,
          received_at,
          processed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14, $15)
        RETURNING *
      `,
      [
        payload.externalMessageId ?? null,
        payload.conversationId ?? null,
        payload.channel,
        payload.direction,
        payload.senderId ?? null,
        payload.senderName ?? null,
        payload.senderAddress ?? null,
        payload.recipientAddress ?? null,
        payload.subject ?? null,
        payload.body,
        payload.normalizedText,
        payload.metadata ? JSON.stringify(payload.metadata) : null,
        payload.status,
        payload.receivedAt,
        payload.processedAt ?? null,
      ],
    );

    return this.mapRow(row);
  }

  async updateStatus(
    messageId: number,
    status: OmnichannelMessageStatus,
    processedAt?: Date,
  ): Promise<void> {
    await this.databaseService.query(
      `
        UPDATE omnichannel_messages
        SET status = $2, processed_at = COALESCE($3, processed_at), updated_at = NOW()
        WHERE id = $1
      `,
      [messageId, status, processedAt ?? null],
    );
  }

  async findById(messageId: number): Promise<OmnichannelMessage | null> {
    const [row] = await this.databaseService.query<MessageRow>(
      `SELECT * FROM omnichannel_messages WHERE id = $1 LIMIT 1`,
      [messageId],
    );

    return row ? this.mapRow(row) : null;
  }

  async findMany(
    filters: OmnichannelMessageFilters,
  ): Promise<OmnichannelMessage[]> {
    const rows = await this.databaseService.query<MessageRow>(
      `
        SELECT *
        FROM omnichannel_messages
        WHERE ($1::text IS NULL OR channel = $1)
          AND ($2::text IS NULL OR status = $2)
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4
      `,
      [
        filters.channel ?? null,
        filters.status ?? null,
        filters.limit,
        filters.offset,
      ],
    );

    return rows.map((row) => this.mapRow(row));
  }

  async getOverview(): Promise<{
    totalMessages: number;
    inboundMessages: number;
    outboundMessages: number;
    failedMessages: number;
  }> {
    const [row] = await this.databaseService.query<{
      total_messages: number;
      inbound_messages: number;
      outbound_messages: number;
      failed_messages: number;
    }>(
      `
        SELECT
          COUNT(*)::int AS total_messages,
          COUNT(*) FILTER (WHERE direction = 'INBOUND')::int AS inbound_messages,
          COUNT(*) FILTER (WHERE direction = 'OUTBOUND')::int AS outbound_messages,
          COUNT(*) FILTER (WHERE status = 'FAILED')::int AS failed_messages
        FROM omnichannel_messages
      `,
    );

    return {
      totalMessages: row?.total_messages ?? 0,
      inboundMessages: row?.inbound_messages ?? 0,
      outboundMessages: row?.outbound_messages ?? 0,
      failedMessages: row?.failed_messages ?? 0,
    };
  }

  private mapRow(row: MessageRow): OmnichannelMessage {
    return new OmnichannelMessage({
      id: row.id,
      externalMessageId: row.external_message_id,
      conversationId: row.conversation_id,
      channel: row.channel,
      direction: row.direction,
      senderId: row.sender_id,
      senderName: row.sender_name,
      senderAddress: row.sender_address,
      recipientAddress: row.recipient_address,
      subject: row.subject,
      body: row.body,
      normalizedText: row.normalized_text,
      metadata: row.metadata,
      status: row.status,
      receivedAt: new Date(row.received_at),
      processedAt: row.processed_at ? new Date(row.processed_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
