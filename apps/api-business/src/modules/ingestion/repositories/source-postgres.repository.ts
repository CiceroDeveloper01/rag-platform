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
  tenant_id: string | null;
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
  ingestion_attempt_count?: number | null;
  last_ingestion_attempt_at?: Date | null;
  last_ingestion_event_id?: string | null;
  last_ingestion_correlation_id?: string | null;
  last_failure_at?: Date | null;
}

@Injectable()
export class SourcePostgresRepository implements SourceRepositoryInterface {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(payload: CreateSourcePayload): Promise<SourceRecord> {
    const [row] = await this.databaseService.query<SourceRow>(
      `
        INSERT INTO sources (
          tenant_id,
          name,
          filename,
          type,
          source_channel,
          storage_key,
          storage_url,
          ingestion_status,
          ingestion_current_step,
          ingestion_failure_reason,
          ingestion_attempt_count,
          last_ingestion_attempt_at,
          last_ingestion_event_id,
          last_ingestion_correlation_id,
          last_failure_at
        )
        VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING
          id,
          tenant_id,
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
          COALESCE(updated_at, uploaded_at, created_at, NOW()) AS updated_at,
          ingestion_attempt_count,
          last_ingestion_attempt_at,
          last_ingestion_event_id,
          last_ingestion_correlation_id,
          last_failure_at
      `,
      [
        payload.tenantId,
        payload.filename,
        payload.type,
        payload.sourceChannel ?? null,
        payload.storageKey ?? null,
        payload.storageUrl ?? null,
        payload.ingestionStatus ?? 'PENDING',
        payload.ingestionCurrentStep ?? null,
        payload.ingestionFailureReason ?? null,
        payload.ingestionAttemptCount ?? 0,
        payload.lastIngestionAttemptAt ?? null,
        payload.lastIngestionEventId ?? null,
        payload.lastIngestionCorrelationId ?? null,
        payload.lastFailureAt ?? null,
      ],
    );

    return this.mapRowToRecord(row);
  }

  async list(payload: ListSourcesPayload): Promise<SourceRecord[]> {
    const rows = await this.databaseService.query<SourceRow>(
      `
        SELECT
          s.id,
          s.tenant_id,
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
          s.ingestion_attempt_count,
          s.last_ingestion_attempt_at,
          s.last_ingestion_event_id,
          s.last_ingestion_correlation_id,
          s.last_failure_at,
          COUNT(d.id)::int AS chunks_count
        FROM sources s
        LEFT JOIN documents d ON d.source_id = s.id
        WHERE
          ($1::text IS NULL OR COALESCE(s.filename, s.name) ILIKE CONCAT('%', $1, '%'))
          AND ($2::text IS NULL OR s.type = $2)
        GROUP BY
          s.id,
          s.tenant_id,
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
          s.updated_at,
          s.ingestion_attempt_count,
          s.last_ingestion_attempt_at,
          s.last_ingestion_event_id,
          s.last_ingestion_correlation_id,
          s.last_failure_at
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
          s.tenant_id,
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
          s.ingestion_attempt_count,
          s.last_ingestion_attempt_at,
          s.last_ingestion_event_id,
          s.last_ingestion_correlation_id,
          s.last_failure_at,
          COUNT(d.id)::int AS chunks_count
        FROM sources s
        LEFT JOIN documents d ON d.source_id = s.id
        WHERE s.id = $1
        GROUP BY
          s.id,
          s.tenant_id,
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
          s.updated_at,
          s.ingestion_attempt_count,
          s.last_ingestion_attempt_at,
          s.last_ingestion_event_id,
          s.last_ingestion_correlation_id,
          s.last_failure_at
        LIMIT 1
      `,
      [sourceId],
    );

    return row ? this.mapRowToRecord(row) : null;
  }

  async update(
    sourceId: number,
    payload: {
      tenantId?: string;
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
      ingestionAttemptCount?: number;
      lastIngestionAttemptAt?: Date | null;
      lastIngestionEventId?: string | null;
      lastIngestionCorrelationId?: string | null;
      lastFailureAt?: Date | null;
    },
  ): Promise<SourceRecord | null> {
    const [row] = await this.databaseService.query<SourceRow>(
      `
        UPDATE sources
        SET
          tenant_id = COALESCE($2, tenant_id),
          filename = COALESCE($3, filename),
          name = COALESCE($3, name),
          type = COALESCE($4, type),
          source_channel = COALESCE($5, source_channel),
          ingestion_status = COALESCE($6, ingestion_status),
          ingestion_current_step = $7,
          ingestion_failure_reason = $8,
          storage_key = COALESCE($9, storage_key),
          storage_url = COALESCE($10, storage_url),
          processing_started_at = COALESCE($11, processing_started_at),
          completed_at = $12,
          ingestion_attempt_count = COALESCE($13, ingestion_attempt_count),
          last_ingestion_attempt_at = COALESCE($14, last_ingestion_attempt_at),
          last_ingestion_event_id = COALESCE($15, last_ingestion_event_id),
          last_ingestion_correlation_id = COALESCE($16, last_ingestion_correlation_id),
          last_failure_at = COALESCE($17, last_failure_at),
          updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          tenant_id,
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
          COALESCE(updated_at, uploaded_at, created_at, NOW()) AS updated_at,
          ingestion_attempt_count,
          last_ingestion_attempt_at,
          last_ingestion_event_id,
          last_ingestion_correlation_id,
          last_failure_at
      `,
      [
        sourceId,
        payload.tenantId ?? null,
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
        payload.ingestionAttemptCount ?? null,
        payload.lastIngestionAttemptAt ?? null,
        payload.lastIngestionEventId ?? null,
        payload.lastIngestionCorrelationId ?? null,
        payload.lastFailureAt ?? null,
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
      tenantId: row.tenant_id ?? 'default-tenant',
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
      ingestionAttemptCount: row.ingestion_attempt_count ?? 0,
      lastIngestionAttemptAt: row.last_ingestion_attempt_at
        ? new Date(row.last_ingestion_attempt_at)
        : null,
      lastIngestionEventId: row.last_ingestion_event_id ?? null,
      lastIngestionCorrelationId: row.last_ingestion_correlation_id ?? null,
      lastFailureAt: row.last_failure_at ? new Date(row.last_failure_at) : null,
    };
  }
}
