import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../infra/database/database.service';
import {
  CreateSourcePayload,
  ListSourcesPayload,
  SourceRepositoryInterface,
} from '../interfaces/source-repository.interface';
import { SourceRecord } from '../interfaces/source-record.interface';
import {
  SourceIngestionStatus,
  SourceProcessingStep,
} from '../interfaces/source-status.type';

interface SourceRow {
  id: number;
  filename: string;
  uploaded_at: Date;
  type: string | null;
  source_channel: string | null;
  ingestion_status: SourceIngestionStatus | null;
  ingestion_current_step: SourceProcessingStep | null;
  ingestion_failure_reason: string | null;
  storage_key?: string | null;
  storage_url?: string | null;
  processing_started_at?: Date | null;
  completed_at?: Date | null;
  updated_at?: Date | null;
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
          source_channel,
          storage_key,
          storage_url,
          ingestion_status,
          ingestion_current_step,
          ingestion_failure_reason
        )
        VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
          id,
          COALESCE(filename, name) AS filename,
          COALESCE(uploaded_at, created_at, NOW()) AS uploaded_at,
          type,
          source_channel,
          ingestion_status,
          ingestion_current_step,
          ingestion_failure_reason,
          storage_key,
          storage_url,
          processing_started_at,
          completed_at,
          COALESCE(updated_at, uploaded_at, created_at, NOW()) AS updated_at
      `,
      [
        payload.filename,
        payload.type,
        payload.sourceChannel ?? null,
        payload.storageKey ?? null,
        payload.storageUrl ?? null,
        payload.ingestionStatus ?? 'PENDING',
        payload.ingestionCurrentStep ?? null,
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
          s.source_channel,
          s.ingestion_status,
          s.ingestion_current_step,
          s.ingestion_failure_reason,
          s.storage_key,
          s.storage_url,
          s.processing_started_at,
          s.completed_at,
          COALESCE(s.updated_at, s.uploaded_at, s.created_at, NOW()) AS updated_at,
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
          s.source_channel,
          s.ingestion_status,
          s.ingestion_current_step,
          s.ingestion_failure_reason,
          s.storage_key,
          s.storage_url,
          s.processing_started_at,
          s.completed_at,
          s.updated_at
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
          s.source_channel,
          s.ingestion_status,
          s.ingestion_current_step,
          s.ingestion_failure_reason,
          s.storage_key,
          s.storage_url,
          s.processing_started_at,
          s.completed_at,
          COALESCE(s.updated_at, s.uploaded_at, s.created_at, NOW()) AS updated_at,
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
          s.source_channel,
          s.ingestion_status,
          s.ingestion_current_step,
          s.ingestion_failure_reason,
          s.storage_key,
          s.storage_url,
          s.processing_started_at,
          s.completed_at,
          s.updated_at
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
      sourceChannel?: string | null;
      ingestionStatus?: SourceIngestionStatus;
      ingestionCurrentStep?: SourceProcessingStep | null;
      ingestionFailureReason?: string | null;
      storageKey?: string | null;
      storageUrl?: string | null;
      processingStartedAt?: Date | null;
      completedAt?: Date | null;
    },
  ): Promise<SourceRecord | null> {
    const [row] = await this.databaseService.query<SourceRow>(
      `
        UPDATE sources
        SET
          filename = COALESCE($2, filename),
          name = COALESCE($2, name),
          type = COALESCE($3, type),
          source_channel = COALESCE($4, source_channel),
          ingestion_status = COALESCE($5, ingestion_status),
          ingestion_current_step = $6,
          ingestion_failure_reason = $7,
          storage_key = COALESCE($8, storage_key),
          storage_url = COALESCE($9, storage_url),
          processing_started_at = COALESCE($10, processing_started_at),
          completed_at = $11,
          updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          COALESCE(filename, name) AS filename,
          COALESCE(uploaded_at, created_at, NOW()) AS uploaded_at,
          type,
          source_channel,
          ingestion_status,
          ingestion_current_step,
          ingestion_failure_reason,
          storage_key,
          storage_url,
          processing_started_at,
          completed_at,
          COALESCE(updated_at, uploaded_at, created_at, NOW()) AS updated_at
      `,
      [
        sourceId,
        payload.filename ?? null,
        payload.type ?? null,
        payload.sourceChannel ?? null,
        payload.ingestionStatus ?? null,
        payload.ingestionCurrentStep ?? null,
        payload.ingestionFailureReason ?? null,
        payload.storageKey ?? null,
        payload.storageUrl ?? null,
        payload.processingStartedAt ?? null,
        payload.completedAt ?? null,
      ],
    );

    return row ? this.mapRowToRecord(row) : null;
  }

  async delete(sourceId: number): Promise<void> {
    await this.databaseService.query(
      `DELETE FROM documents WHERE source_id = $1`,
      [sourceId],
    );
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
      sourceChannel: row.source_channel ?? null,
      ingestionStatus: row.ingestion_status ?? 'PENDING',
      ingestionCurrentStep: row.ingestion_current_step ?? null,
      ingestionFailureReason: row.ingestion_failure_reason ?? null,
      storageKey: row.storage_key ?? null,
      storageUrl: row.storage_url ?? null,
      processingStartedAt: row.processing_started_at
        ? new Date(row.processing_started_at)
        : null,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
      chunksCount: row.chunks_count,
    };
  }
}
