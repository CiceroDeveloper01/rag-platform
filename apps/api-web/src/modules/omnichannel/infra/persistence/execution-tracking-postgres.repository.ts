import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../infra/database/database.service';
import {
  CompleteTrackedExecutionInput,
  CreateTrackedExecutionInput,
  FailTrackedExecutionInput,
  IExecutionTrackingRepository,
  LogExecutionEventInput,
  TrackedExecutionEventRecord,
  TrackedExecutionRecord,
} from '../../application/interfaces/execution-tracking-repository.interface';
import { OmnichannelExecutionStatus } from '../../domain/enums/omnichannel-execution-status.enum';

interface ExecutionRow {
  id: number;
  source_type: string;
  source_id: number;
  channel: string;
  correlation_id: string;
  trace_id: string;
  status: OmnichannelExecutionStatus;
  error_message: string | null;
  started_at: Date;
  finished_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface ExecutionEventRow {
  id: number;
  execution_id: number;
  event_name: string;
  metadata: Record<string, unknown> | null;
  occurred_at: Date;
  created_at: Date;
}

@Injectable()
export class ExecutionTrackingPostgresRepository implements IExecutionTrackingRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createExecution(
    input: CreateTrackedExecutionInput,
  ): Promise<TrackedExecutionRecord> {
    const [row] = await this.databaseService.query<ExecutionRow>(
      `
        INSERT INTO executions (
          source_type,
          source_id,
          channel,
          correlation_id,
          trace_id,
          status,
          started_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (source_type, source_id)
        DO UPDATE SET
          channel = EXCLUDED.channel,
          correlation_id = EXCLUDED.correlation_id,
          trace_id = EXCLUDED.trace_id,
          status = EXCLUDED.status,
          started_at = EXCLUDED.started_at,
          updated_at = NOW()
        RETURNING *
      `,
      [
        input.sourceType,
        input.sourceId,
        input.channel,
        input.correlationId,
        input.traceId,
        input.status ?? OmnichannelExecutionStatus.STARTED,
        input.startedAt ?? new Date(),
      ],
    );

    return this.mapExecutionRow(row);
  }

  async logEvent(
    input: LogExecutionEventInput,
  ): Promise<TrackedExecutionEventRecord> {
    const [row] = await this.databaseService.query<ExecutionEventRow>(
      `
        INSERT INTO execution_events (
          execution_id,
          event_name,
          metadata,
          occurred_at
        )
        VALUES ($1, $2, $3::jsonb, $4)
        RETURNING *
      `,
      [
        input.executionId,
        input.eventName,
        JSON.stringify(input.metadata ?? null),
        input.occurredAt ?? new Date(),
      ],
    );

    return this.mapEventRow(row);
  }

  async completeExecution(input: CompleteTrackedExecutionInput): Promise<void> {
    await this.databaseService.query(
      `
        UPDATE executions
        SET
          status = $2,
          finished_at = $3,
          error_message = NULL,
          updated_at = NOW()
        WHERE id = $1
      `,
      [
        input.executionId,
        input.status ?? OmnichannelExecutionStatus.SUCCESS,
        input.finishedAt,
      ],
    );
  }

  async failExecution(input: FailTrackedExecutionInput): Promise<void> {
    await this.databaseService.query(
      `
        UPDATE executions
        SET
          status = $2,
          error_message = $3,
          finished_at = $4,
          updated_at = NOW()
        WHERE id = $1
      `,
      [
        input.executionId,
        input.status ?? OmnichannelExecutionStatus.FAILED,
        input.errorMessage,
        input.finishedAt,
      ],
    );
  }

  private mapExecutionRow(row: ExecutionRow): TrackedExecutionRecord {
    return {
      id: row.id,
      sourceType: row.source_type,
      sourceId: row.source_id,
      channel: row.channel as TrackedExecutionRecord['channel'],
      correlationId: row.correlation_id,
      traceId: row.trace_id,
      status: row.status,
      errorMessage: row.error_message,
      startedAt: new Date(row.started_at),
      finishedAt: row.finished_at ? new Date(row.finished_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapEventRow(row: ExecutionEventRow): TrackedExecutionEventRecord {
    return {
      id: row.id,
      executionId: row.execution_id,
      eventName: row.event_name as TrackedExecutionEventRecord['eventName'],
      metadata: row.metadata,
      occurredAt: new Date(row.occurred_at),
      createdAt: new Date(row.created_at),
    };
  }
}
