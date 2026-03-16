import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../infra/database/database.service';
import {
  CreateQueryPayload,
  QueryRepositoryInterface,
} from '../interfaces/query-repository.interface';
import { QueryRecord } from '../interfaces/query-record.interface';

interface QueryRow {
  id: number;
  question: string;
  response: string;
  created_at: Date;
}

@Injectable()
export class QueryPostgresRepository implements QueryRepositoryInterface {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(payload: CreateQueryPayload): Promise<QueryRecord> {
    const [row] = await this.databaseService.query<QueryRow>(
      `
        INSERT INTO queries (question, response, user_id, conversation_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, question, response, created_at
      `,
      [
        payload.question,
        payload.answer,
        payload.userId ?? null,
        payload.conversationId ?? null,
      ],
    );

    return {
      id: row.id,
      question: row.question,
      answer: row.response,
      createdAt: new Date(row.created_at),
    };
  }
}
