import { Injectable } from '@nestjs/common';
import { serializeVector } from '../../../common/utils/vector.util';
import { DatabaseService } from '../../../infra/database/database.service';
import {
  ConversationMemoryRepositoryInterface,
  QueryConversationMemoryPayload,
  StoreConversationMemoryPayload,
} from '../interfaces/conversation-memory-repository.interface';
import { ConversationMemoryRecord } from '../interfaces/conversation-memory-record.interface';

interface ConversationMemoryRow {
  id: number;
  tenant_id: string;
  channel: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  expires_at: Date | null;
  similarity?: number;
}

@Injectable()
export class ConversationMemoryPostgresRepository implements ConversationMemoryRepositoryInterface {
  constructor(private readonly databaseService: DatabaseService) {}

  async store(
    payload: StoreConversationMemoryPayload,
  ): Promise<ConversationMemoryRecord> {
    const [row] = await this.databaseService.query<ConversationMemoryRow>(
      `
        INSERT INTO conversation_memory (
          tenant_id,
          channel,
          conversation_id,
          role,
          message,
          embedding,
          metadata,
          created_at,
          expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::vector, $7::jsonb, $8, $9)
        RETURNING
          id,
          tenant_id,
          channel,
          conversation_id,
          role,
          message,
          metadata,
          created_at,
          expires_at
      `,
      [
        payload.tenantId,
        payload.channel,
        payload.conversationId,
        payload.role,
        payload.message,
        serializeVector(payload.embedding),
        JSON.stringify(payload.metadata ?? {}),
        payload.createdAt.toISOString(),
        payload.expiresAt?.toISOString() ?? null,
      ],
    );

    return this.mapRow(row);
  }

  async findRecent(
    payload: QueryConversationMemoryPayload,
  ): Promise<ConversationMemoryRecord[]> {
    const rows = await this.databaseService.query<ConversationMemoryRow>(
      `
        SELECT
          id,
          tenant_id,
          channel,
          conversation_id,
          role,
          message,
          metadata,
          created_at,
          expires_at
        FROM conversation_memory
        WHERE
          tenant_id = $1
          AND channel = $2
          AND conversation_id = $3
          AND (expires_at IS NULL OR expires_at > $4)
        ORDER BY created_at DESC
        LIMIT $5
      `,
      [
        payload.tenantId,
        payload.channel,
        payload.conversationId,
        payload.now.toISOString(),
        payload.recentLimit,
      ],
    );

    return rows.map((row) => this.mapRow(row)).reverse();
  }

  async findSimilar(
    payload: QueryConversationMemoryPayload,
  ): Promise<ConversationMemoryRecord[]> {
    const rows = await this.databaseService.query<ConversationMemoryRow>(
      `
        SELECT
          id,
          tenant_id,
          channel,
          conversation_id,
          role,
          message,
          metadata,
          created_at,
          expires_at,
          CAST(1 - (embedding <=> $5::vector) AS DOUBLE PRECISION) AS similarity
        FROM conversation_memory
        WHERE
          tenant_id = $1
          AND channel = $2
          AND conversation_id = $3
          AND (expires_at IS NULL OR expires_at > $4)
        ORDER BY embedding <=> $5::vector
        LIMIT $6
      `,
      [
        payload.tenantId,
        payload.channel,
        payload.conversationId,
        payload.now.toISOString(),
        serializeVector(payload.queryEmbedding),
        payload.semanticLimit,
      ],
    );

    return rows.map((row) => this.mapRow(row));
  }

  async trimConversation(
    tenantId: string,
    channel: string,
    conversationId: string,
    keepLatest: number,
  ): Promise<void> {
    await this.databaseService.query(
      `
        DELETE FROM conversation_memory
        WHERE id IN (
          SELECT id
          FROM conversation_memory
          WHERE
            tenant_id = $1
            AND channel = $2
            AND conversation_id = $3
          ORDER BY created_at DESC
          OFFSET $4
        )
      `,
      [tenantId, channel, conversationId, keepLatest],
    );
  }

  async purgeExpired(now: Date): Promise<number> {
    const rows = await this.databaseService.query<{ id: number }>(
      `
        DELETE FROM conversation_memory
        WHERE expires_at IS NOT NULL
          AND expires_at <= $1
        RETURNING id
      `,
      [now.toISOString()],
    );

    return rows.length;
  }

  private mapRow(row: ConversationMemoryRow): ConversationMemoryRecord {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      channel: row.channel,
      conversationId: row.conversation_id,
      role: row.role,
      message: row.message,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : null,
      similarity:
        typeof row.similarity === 'number' ? Number(row.similarity) : undefined,
    };
  }
}
