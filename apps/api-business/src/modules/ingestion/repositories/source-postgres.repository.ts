import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../infra/database/database.service';
import {
  CreateSourcePayload,
  ListSourcesPayload,
  SourceRepositoryInterface,
} from '../interfaces/source-repository.interface';
import { SourceRecord } from '../interfaces/source-record.interface';
import { SourceIngestionStatus } from '../interfaces/source-status.type';

interface SourceRow {
  id: number;
  filename: string;
  uploaded_at: Date;
  type: string | null;
  ingestion_status: SourceIngestionStatus | null;
  ingestion_failure_reason: string | null;
  storage_key?: string | null;
  storage_url?: string | null;
  chunks_count?: number;
}

@Injectable()
export class SourcePostgresRepository implements SourceRepositoryInterface {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(payload: CreateSourcePayload): Promise<SourceRecord> {
    const [row] = await this.databaseService.query<SourceRow>(
      `
        INSERT INTO sources (
          name,
          filename,
          type,
          storage_key,
          storage_url,
          ingestion_status,
          ingestion_failure_reason
        )
        VALUES ($1, $1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          COALESCE(filename, name) AS filename,
          COALESCE(uploaded_at, created_at, NOW()) AS uploaded_at,
          type,
          ingestion_status,
          ingestion_failure_reason,
          storage_key,
          storage_url
      `,
      [
        payload.filename,
        payload.type,
        payload.storageKey ?? null,
        payload.storageUrl ?? null,
        payload.ingestionStatus ?? 'PENDING',
        payload.ingestionFailureReason ?? null,
      ],
    );

    return this.mapRowToRecord(row);
  }

  async list(payload: ListSourcesPayload): Promise<SourceRecord[]> {
    const rows = await this.databaseService.query<SourceRow>(
      `
        SELECT
          s.id,
          COALESCE(s.filename, s.name) AS filename,
          COALESCE(s.uploaded_at, s.created_at, NOW()) AS uploaded_at,
          s.type,
          s.ingestion_status,
          s.ingestion_failure_reason,
          s.storage_key,
          s.storage_url,
          COUNT(d.id)::int AS chunks_count
        FROM sources s
        LEFT JOIN documents d ON d.source_id = s.id
        WHERE
          ($1::text IS NULL OR COALESCE(s.filename, s.name) ILIKE CONCAT('%', $1, '%'))
          AND ($2::text IS NULL OR s.type = $2)
        GROUP BY
          s.id,
          s.filename,
          s.name,
          s.uploaded_at,
          s.created_at,
          s.type,
          s.ingestion_status,
          s.ingestion_failure_reason,
          s.storage_key,
          s.storage_url
        ORDER BY uploaded_at ${payload.order === 'asc' ? 'ASC' : 'DESC'}
        LIMIT $3 OFFSET $4
      `,
      [
        payload.query ?? null,
        payload.type ?? null,
        payload.limit,
        payload.offset,
      ],
    );

    return rows.map((row) => this.mapRowToRecord(row));
  }

  async findById(sourceId: number): Promise<SourceRecord | null> {
    const [row] = await this.databaseService.query<SourceRow>(
      `
        SELECT
          s.id,
          COALESCE(s.filename, s.name) AS filename,
          COALESCE(s.uploaded_at, s.created_at, NOW()) AS uploaded_at,
          s.type,
          s.ingestion_status,
          s.ingestion_failure_reason,
          s.storage_key,
          s.storage_url,
          COUNT(d.id)::int AS chunks_count
        FROM sources s
        LEFT JOIN documents d ON d.source_id = s.id
        WHERE s.id = $1
        GROUP BY
          s.id,
          s.filename,
          s.name,
          s.uploaded_at,
          s.created_at,
          s.type,
          s.ingestion_status,
          s.ingestion_failure_reason,
          s.storage_key,
          s.storage_url
        LIMIT 1
      `,
      [sourceId],
    );

    return row ? this.mapRowToRecord(row) : null;
  }

  async update(
    sourceId: number,
    payload: {
      filename?: string;
      type?: string;
      ingestionStatus?: SourceIngestionStatus;
      ingestionFailureReason?: string | null;
      storageKey?: string | null;
      storageUrl?: string | null;
    },
  ): Promise<SourceRecord | null> {
    const [row] = await this.databaseService.query<SourceRow>(
      `
        UPDATE sources
        SET
          filename = COALESCE($2, filename),
          name = COALESCE($2, name),
          type = COALESCE($3, type),
          ingestion_status = COALESCE($4, ingestion_status),
          ingestion_failure_reason = $5,
          storage_key = COALESCE($6, storage_key),
          storage_url = COALESCE($7, storage_url)
        WHERE id = $1
        RETURNING
          id,
          COALESCE(filename, name) AS filename,
          COALESCE(uploaded_at, created_at, NOW()) AS uploaded_at,
          type,
          ingestion_status,
          ingestion_failure_reason,
          storage_key,
          storage_url
      `,
      [
        sourceId,
        payload.filename ?? null,
        payload.type ?? null,
        payload.ingestionStatus ?? null,
        payload.ingestionFailureReason ?? null,
        payload.storageKey ?? null,
        payload.storageUrl ?? null,
      ],
    );

    return row ? this.mapRowToRecord(row) : null;
  }

  async delete(sourceId: number): Promise<void> {
    await this.databaseService.query(`DELETE FROM documents WHERE source_id = $1`, [
      sourceId,
    ]);
    await this.databaseService.query(`DELETE FROM sources WHERE id = $1`, [
      sourceId,
    ]);
  }

  private mapRowToRecord(row: SourceRow): SourceRecord {
    return {
      id: row.id,
      filename: row.filename,
      uploadedAt: new Date(row.uploaded_at),
      type: row.type,
      ingestionStatus: row.ingestion_status ?? 'PENDING',
      ingestionFailureReason: row.ingestion_failure_reason ?? null,
      storageKey: row.storage_key ?? null,
      storageUrl: row.storage_url ?? null,
      chunksCount: row.chunks_count,
    };
  }
}
