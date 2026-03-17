import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DatabaseService } from '../../../../infra/database/database.service';
import { MessageChannel } from '../../domain/enums/message-channel.enum';

interface InboundMessageRow {
  id: number;
}

@Injectable()
export class IdempotencyService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IdempotencyService.name);
  }

  async isDuplicate(
    channel: MessageChannel,
    externalId: string,
  ): Promise<boolean> {
    const [row] = await this.databaseService.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM inbound_messages
          WHERE channel = $1
            AND external_message_id = $2
        ) AS "exists"
      `,
      [channel, externalId],
    );

    return Boolean(row?.exists);
  }

  async register(
    channel: MessageChannel,
    externalId: string,
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    const [row] = await this.databaseService.query<InboundMessageRow>(
      `
        INSERT INTO inbound_messages (channel, external_message_id, payload)
        VALUES ($1, $2, $3::jsonb)
        ON CONFLICT (channel, external_message_id) DO NOTHING
        RETURNING id
      `,
      [channel, externalId, JSON.stringify(payload)],
    );

    const inserted = Boolean(row?.id);

    if (!inserted) {
      this.logger.info(
        {
          channel,
          externalMessageId: externalId,
          duplicate: true,
        },
        'Inbound message skipped due to idempotency',
      );
    }

    return inserted;
  }
}
