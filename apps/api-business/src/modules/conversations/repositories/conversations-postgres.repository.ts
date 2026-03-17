import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../infra/database/database.service';
import type {
  AppendConversationMessagePayload,
  ConversationsRepositoryInterface,
  CreateConversationPayload,
  ListConversationsOptions,
} from '../interfaces/conversations-repository.interface';
import type {
  ConversationMessageRecord,
  ConversationRecord,
} from '../interfaces/conversation-record.interface';

interface ConversationRow {
  id: number;
  user_id: number;
  title: string;
  created_at: Date;
  updated_at: Date;
}

interface ConversationMessageRow {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: Date;
}

@Injectable()
export class ConversationsPostgresRepository implements ConversationsRepositoryInterface {
  constructor(private readonly databaseService: DatabaseService) {}

  async listByUser(
    options: ListConversationsOptions,
  ): Promise<ConversationRecord[]> {
    const rows = await this.databaseService.query<ConversationRow>(
      `
        SELECT id, user_id, title, created_at, updated_at
        FROM conversations
        WHERE user_id = $1
        ORDER BY updated_at DESC
        LIMIT $2 OFFSET $3
      `,
      [options.userId, options.limit, options.offset],
    );

    const messages = await this.loadMessages(rows.map((row) => row.id));
    return rows.map((row) =>
      this.mapConversationRow(row, messages[row.id] ?? []),
    );
  }

  async findById(
    conversationId: number,
    userId: number,
  ): Promise<ConversationRecord | null> {
    const [row] = await this.databaseService.query<ConversationRow>(
      `
        SELECT id, user_id, title, created_at, updated_at
        FROM conversations
        WHERE id = $1 AND user_id = $2
        LIMIT 1
      `,
      [conversationId, userId],
    );

    if (!row) {
      return null;
    }

    const messages = await this.loadMessages([conversationId]);
    return this.mapConversationRow(row, messages[conversationId] ?? []);
  }

  async create(
    payload: CreateConversationPayload,
  ): Promise<ConversationRecord> {
    const [row] = await this.databaseService.query<ConversationRow>(
      `
        INSERT INTO conversations (user_id, title)
        VALUES ($1, $2)
        RETURNING id, user_id, title, created_at, updated_at
      `,
      [payload.userId, payload.title],
    );

    return this.mapConversationRow(row, []);
  }

  async appendMessage(
    payload: AppendConversationMessagePayload,
  ): Promise<ConversationMessageRecord> {
    const [row] = await this.databaseService.query<ConversationMessageRow>(
      `
        INSERT INTO conversation_messages (conversation_id, role, content)
        VALUES ($1, $2, $3)
        RETURNING id, conversation_id, role, content, created_at
      `,
      [payload.conversationId, payload.role, payload.content],
    );

    await this.databaseService.query(
      `
        UPDATE conversations
        SET updated_at = NOW()
        WHERE id = $1
      `,
      [payload.conversationId],
    );

    return this.mapMessageRow(row);
  }

  async delete(conversationId: number, userId: number): Promise<void> {
    await this.databaseService.query(
      `
        DELETE FROM conversations
        WHERE id = $1 AND user_id = $2
      `,
      [conversationId, userId],
    );
  }

  async updateTitle(
    conversationId: number,
    userId: number,
    title: string,
  ): Promise<ConversationRecord | null> {
    const [row] = await this.databaseService.query<ConversationRow>(
      `
        UPDATE conversations
        SET title = $3, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING id, user_id, title, created_at, updated_at
      `,
      [conversationId, userId, title],
    );

    if (!row) {
      return null;
    }

    const messages = await this.loadMessages([conversationId]);
    return this.mapConversationRow(row, messages[conversationId] ?? []);
  }

  private async loadMessages(
    conversationIds: number[],
  ): Promise<Record<number, ConversationMessageRecord[]>> {
    if (conversationIds.length === 0) {
      return {};
    }

    const rows = await this.databaseService.query<ConversationMessageRow>(
      `
        SELECT id, conversation_id, role, content, created_at
        FROM conversation_messages
        WHERE conversation_id = ANY($1::int[])
        ORDER BY created_at ASC
      `,
      [conversationIds],
    );

    return rows.reduce<Record<number, ConversationMessageRecord[]>>(
      (accumulator, row) => {
        const collection = accumulator[row.conversation_id] ?? [];
        collection.push(this.mapMessageRow(row));
        accumulator[row.conversation_id] = collection;
        return accumulator;
      },
      {},
    );
  }

  private mapConversationRow(
    row: ConversationRow,
    messages: ConversationMessageRecord[],
  ): ConversationRecord {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      messages,
    };
  }

  private mapMessageRow(
    row: ConversationMessageRow,
  ): ConversationMessageRecord {
    return {
      id: row.id,
      role: row.role,
      content: row.content,
      createdAt: new Date(row.created_at),
    };
  }
}
