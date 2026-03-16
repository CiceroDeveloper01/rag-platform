import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../infra/database/database.service';
import { OmnichannelExecution } from '../../domain/entities/omnichannel-execution.entity';
import { OmnichannelExecutionStatus } from '../../domain/enums/omnichannel-execution-status.enum';
import {
  IExecutionRepository,
  OmnichannelExecutionFilters,
} from '../../domain/repositories/execution-repository.interface';

interface ExecutionRow {
  id: number;
  message_id: number;
  trace_id: string;
  span_id: string;
  agent_name: string;
  used_rag: boolean;
  rag_query: string | null;
  model_name: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  latency_ms: number | null;
  status: OmnichannelExecutionStatus;
  error_message: string | null;
  started_at: Date;
  finished_at: Date | null;
  created_at: Date;
}

@Injectable()
export class OmnichannelExecutionPostgresRepository implements IExecutionRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(execution: OmnichannelExecution): Promise<OmnichannelExecution> {
    const payload = execution.toObject();
    const [row] = await this.databaseService.query<ExecutionRow>(
      `
        INSERT INTO omnichannel_executions (
          message_id,
          trace_id,
          span_id,
          agent_name,
          used_rag,
          rag_query,
          model_name,
          input_tokens,
          output_tokens,
          latency_ms,
          status,
          error_message,
          started_at,
          finished_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `,
      [
        payload.messageId,
        payload.traceId,
        payload.spanId,
        payload.agentName,
        payload.usedRag,
        payload.ragQuery ?? null,
        payload.modelName ?? null,
        payload.inputTokens ?? null,
        payload.outputTokens ?? null,
        payload.latencyMs ?? null,
        payload.status,
        payload.errorMessage ?? null,
        payload.startedAt,
        payload.finishedAt ?? null,
      ],
    );

    return this.mapRow(row);
  }

  async finishSuccess(
    execution: OmnichannelExecution,
  ): Promise<OmnichannelExecution> {
    const payload = execution.toObject();
    const [row] = await this.databaseService.query<ExecutionRow>(
      `
        UPDATE omnichannel_executions
        SET
          used_rag = $2,
          rag_query = $3,
          model_name = $4,
          input_tokens = $5,
          output_tokens = $6,
          latency_ms = $7,
          status = $8,
          finished_at = $9,
          error_message = NULL
        WHERE id = $1
        RETURNING *
      `,
      [
        payload.id,
        payload.usedRag,
        payload.ragQuery ?? null,
        payload.modelName ?? null,
        payload.inputTokens ?? null,
        payload.outputTokens ?? null,
        payload.latencyMs ?? null,
        payload.status,
        payload.finishedAt ?? null,
      ],
    );

    return this.mapRow(row);
  }

  async finishFailure(
    execution: OmnichannelExecution,
  ): Promise<OmnichannelExecution> {
    const payload = execution.toObject();
    const [row] = await this.databaseService.query<ExecutionRow>(
      `
        UPDATE omnichannel_executions
        SET latency_ms = $2, status = $3, error_message = $4, finished_at = $5
        WHERE id = $1
        RETURNING *
      `,
      [
        payload.id,
        payload.latencyMs ?? null,
        payload.status,
        payload.errorMessage ?? null,
        payload.finishedAt ?? null,
      ],
    );

    return this.mapRow(row);
  }

  async findById(executionId: number): Promise<OmnichannelExecution | null> {
    const [row] = await this.databaseService.query<ExecutionRow>(
      `SELECT * FROM omnichannel_executions WHERE id = $1 LIMIT 1`,
      [executionId],
    );

    return row ? this.mapRow(row) : null;
  }

  async findByMessageId(
    messageId: number,
  ): Promise<OmnichannelExecution | null> {
    const [row] = await this.databaseService.query<ExecutionRow>(
      `
        SELECT *
        FROM omnichannel_executions
        WHERE message_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [messageId],
    );

    return row ? this.mapRow(row) : null;
  }

  async findMany(
    filters: OmnichannelExecutionFilters,
  ): Promise<OmnichannelExecution[]> {
    const rows = await this.databaseService.query<ExecutionRow>(
      `
        SELECT *
        FROM omnichannel_executions
        WHERE ($1::text IS NULL OR status = $1)
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `,
      [filters.status ?? null, filters.limit, filters.offset],
    );

    return rows.map((row) => this.mapRow(row));
  }

  async getOverview(): Promise<{
    totalExecutions: number;
    successExecutions: number;
    failedExecutions: number;
    avgLatencyMs: number;
  }> {
    const [row] = await this.databaseService.query<{
      total_executions: number;
      success_executions: number;
      failed_executions: number;
      avg_latency_ms: number | null;
    }>(
      `
        SELECT
          COUNT(*)::int AS total_executions,
          COUNT(*) FILTER (WHERE status = 'SUCCESS')::int AS success_executions,
          COUNT(*) FILTER (WHERE status IN ('FAILED', 'TIMEOUT'))::int AS failed_executions,
          COALESCE(AVG(latency_ms), 0)::int AS avg_latency_ms
        FROM omnichannel_executions
      `,
    );

    return {
      totalExecutions: row?.total_executions ?? 0,
      successExecutions: row?.success_executions ?? 0,
      failedExecutions: row?.failed_executions ?? 0,
      avgLatencyMs: row?.avg_latency_ms ?? 0,
    };
  }

  private mapRow(row: ExecutionRow): OmnichannelExecution {
    return new OmnichannelExecution({
      id: row.id,
      messageId: row.message_id,
      traceId: row.trace_id,
      spanId: row.span_id,
      agentName: row.agent_name,
      usedRag: row.used_rag,
      ragQuery: row.rag_query,
      modelName: row.model_name,
      inputTokens: row.input_tokens,
      outputTokens: row.output_tokens,
      latencyMs: row.latency_ms,
      status: row.status,
      errorMessage: row.error_message,
      startedAt: new Date(row.started_at),
      finishedAt: row.finished_at ? new Date(row.finished_at) : null,
      createdAt: new Date(row.created_at),
    });
  }
}
