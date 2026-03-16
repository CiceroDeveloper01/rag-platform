import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../infra/database/database.service';
import { serializeVector } from '../../../common/utils/vector.util';
import {
  CreateDocumentPayload,
  DocumentsRepositoryInterface,
  ListDocumentsPayload,
} from '../interfaces/documents-repository.interface';
import { DocumentRecord } from '../interfaces/document-record.interface';

interface InsertedDocumentRow {
  id: number;
  tenant_id: string;
  source_id: number | null;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

@Injectable()
export class DocumentsPostgresRepository implements DocumentsRepositoryInterface {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(payload: CreateDocumentPayload): Promise<DocumentRecord> {
    const [row] = await this.insertMany([payload]);

    return this.mapRowToRecord(row);
  }

  async createMany(
    payload: CreateDocumentPayload[],
  ): Promise<DocumentRecord[]> {
    if (payload.length === 0) {
      return [];
    }

    const rows = await this.insertMany(payload);

    return rows.map((row) => this.mapRowToRecord(row));
  }

  async list(payload: ListDocumentsPayload): Promise<DocumentRecord[]> {
    const rows = await this.databaseService.query<InsertedDocumentRow>(
      `
        SELECT id, tenant_id, source_id, content, metadata, created_at
        FROM documents
        WHERE tenant_id = $1
          AND ($2::text IS NULL OR content ILIKE CONCAT('%', $2, '%'))
        ORDER BY created_at ${payload.order === 'asc' ? 'ASC' : 'DESC'}
        LIMIT $3 OFFSET $4
      `,
      [payload.tenantId, payload.query ?? null, payload.limit, payload.offset],
    );

    return rows.map((row) => this.mapRowToRecord(row));
  }

  async findById(
    documentId: number,
    tenantId: string,
  ): Promise<DocumentRecord | null> {
    const [row] = await this.databaseService.query<InsertedDocumentRow>(
      `
        SELECT id, tenant_id, source_id, content, metadata, created_at
        FROM documents
        WHERE id = $1 AND tenant_id = $2
        LIMIT 1
      `,
      [documentId, tenantId],
    );

    return row ? this.mapRowToRecord(row) : null;
  }

  async update(
    documentId: number,
    tenantId: string,
    payload: { content?: string; metadata?: Record<string, unknown> },
  ): Promise<DocumentRecord | null> {
    const [row] = await this.databaseService.query<InsertedDocumentRow>(
      `
        UPDATE documents
        SET
          content = COALESCE($3, content),
          metadata = COALESCE($4::jsonb, metadata)
        WHERE id = $1 AND tenant_id = $2
        RETURNING id, tenant_id, source_id, content, metadata, created_at
      `,
      [
        documentId,
        tenantId,
        payload.content ?? null,
        payload.metadata ? JSON.stringify(payload.metadata) : null,
      ],
    );

    return row ? this.mapRowToRecord(row) : null;
  }

  async delete(documentId: number, tenantId: string): Promise<void> {
    await this.databaseService.query(
      `
        DELETE FROM documents
        WHERE id = $1 AND tenant_id = $2
      `,
      [documentId, tenantId],
    );
  }

  private async insertMany(
    payload: CreateDocumentPayload[],
  ): Promise<InsertedDocumentRow[]> {
    const valuesClause = payload
      .map((_, index) => {
        const offset = index * 5;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}::vector, $${offset + 5}::jsonb)`;
      })
      .join(', ');

    const parameters = payload.flatMap((document) => [
      document.tenantId,
      document.sourceId ?? null,
      document.content,
      serializeVector(document.embedding),
      JSON.stringify(document.metadata ?? {}),
    ]);

    return this.databaseService.query<InsertedDocumentRow>(
      `
        INSERT INTO documents (tenant_id, source_id, content, embedding, metadata)
        VALUES ${valuesClause}
        RETURNING id, tenant_id, source_id, content, metadata, created_at
      `,
      parameters,
    );
  }

  private mapRowToRecord(row: InsertedDocumentRow): DocumentRecord {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      sourceId: row.source_id,
      content: row.content,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
    };
  }
}
