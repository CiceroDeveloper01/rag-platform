import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../../infra/database/database.service';
import {
  ChannelMetricsDto,
  ConnectorDto,
  LatencyMetricsDto,
  OmnichannelExecutionDetailsDto,
  OmnichannelExecutionListItemDto,
  OmnichannelOverviewResponseDto,
  OmnichannelRequestDetailsDto,
  OmnichannelRequestListItemDto,
  RagUsageMetricsDto,
} from '../../../application/dto/omnichannel-dashboard-response.dto';
import {
  IOmnichannelDashboardQueryRepository,
  PaginatedQueryResult,
} from '../../../application/interfaces/omnichannel-dashboard-query-repository.interface';
import { GetChannelMetricsQuery } from '../../../application/queries/get-channel-metrics.query';
import { GetLatencyMetricsQuery } from '../../../application/queries/get-latency-metrics.query';
import { GetOverviewQuery } from '../../../application/queries/get-overview.query';
import { GetRagUsageQuery } from '../../../application/queries/get-rag-usage.query';
import { ListConnectorsQuery } from '../../../application/queries/list-connectors.query';
import { ListExecutionsQuery } from '../../../application/queries/list-executions.query';
import { ListRequestsQuery } from '../../../application/queries/list-requests.query';
import { MessageChannel } from '../../../domain/enums/message-channel.enum';
import { MessageDirection } from '../../../domain/enums/message-direction.enum';
import { ExecutionEventName } from '../../../domain/enums/execution-event-name.enum';
import { OmnichannelExecutionStatus } from '../../../domain/enums/omnichannel-execution-status.enum';
import { OmnichannelMessageStatus } from '../../../domain/enums/omnichannel-message-status.enum';
import { ConnectorHealthStatus } from '../../../domain/enums/connector-health-status.enum';

interface OverviewRow {
  total_requests: number;
  success_count: number;
  error_count: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  rag_usage_percentage: number;
  active_connectors: number;
  requests_last_24h: number;
  requests_last_7d: number;
}

interface ChannelOverviewRow {
  channel: MessageChannel;
  total_requests: number;
  success_count: number;
  error_count: number;
}

interface RequestListRow {
  id: number;
  channel: MessageChannel;
  conversation_id: string | null;
  sender_name: string | null;
  sender_address: string | null;
  normalized_text_preview: string;
  status: OmnichannelMessageStatus;
  received_at: Date;
  processed_at: Date | null;
  latency_ms: number | null;
  used_rag: boolean | null;
}

interface RequestCountRow {
  total: number;
}

interface RequestDetailsRow {
  message_id: number;
  channel: MessageChannel;
  direction: MessageDirection;
  conversation_id: string | null;
  sender_name: string | null;
  sender_address: string | null;
  recipient_address: string | null;
  subject: string | null;
  body: string;
  normalized_text: string;
  metadata: Record<string, unknown> | null;
  message_status: OmnichannelMessageStatus;
  received_at: Date;
  processed_at: Date | null;
  execution_id: number | null;
  agent_name: string | null;
  used_rag: boolean | null;
  rag_query: string | null;
  model_name: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  latency_ms: number | null;
  execution_status: OmnichannelExecutionStatus | null;
  error_message: string | null;
  started_at: Date | null;
  finished_at: Date | null;
}

interface ExecutionListRow {
  execution_id: number;
  message_id: number;
  channel: MessageChannel;
  agent_name: string;
  used_rag: boolean;
  model_name: string | null;
  latency_ms: number | null;
  status: OmnichannelExecutionStatus;
  started_at: Date;
  finished_at: Date | null;
}

interface ExecutionDetailsRow {
  execution_id: number;
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
}

interface LatencyRow {
  channel: MessageChannel;
  avg_latency_ms: number;
  p95_latency_ms: number;
}

interface RagUsageByChannelRow {
  channel: MessageChannel;
  total_executions: number;
  rag_executions: number;
  rag_usage_percentage: number;
}

interface RagUsageTotalsRow {
  total_executions: number;
  rag_executions: number;
  rag_usage_percentage: number;
}

interface ConnectorRow {
  id: number;
  channel: MessageChannel;
  name: string;
  is_enabled: boolean;
  health_status: ConnectorHealthStatus;
  last_health_check_at: Date | null;
}

interface ExecutionTimelineRow {
  id: number;
  event_name: ExecutionEventName;
  metadata: Record<string, unknown> | null;
  occurred_at: Date;
}

@Injectable()
export class OmnichannelDashboardPostgresQueryRepository implements IOmnichannelDashboardQueryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getOverview(
    query: GetOverviewQuery,
    tenantId: string,
  ): Promise<OmnichannelOverviewResponseDto> {
    const overviewParams = this.buildPeriodParams(
      query.startDate,
      query.endDate,
      tenantId,
    );
    const [overviewRow] = await this.databaseService.query<OverviewRow>(
      `
        SELECT
          COUNT(*)::int AS total_requests,
          COUNT(*) FILTER (WHERE e.status = 'SUCCESS')::int AS success_count,
          COUNT(*) FILTER (WHERE e.status IN ('FAILED', 'TIMEOUT'))::int AS error_count,
          COALESCE(AVG(e.latency_ms), 0)::int AS avg_latency_ms,
          COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY e.latency_ms), 0)::int AS p95_latency_ms,
          COALESCE(
            ROUND(
              (COUNT(*) FILTER (WHERE COALESCE(e.used_rag, false))::numeric / NULLIF(COUNT(e.id), 0)::numeric) * 100,
              2
            ),
            0
          )::float AS rag_usage_percentage,
          (SELECT COUNT(*)::int FROM omnichannel_connectors WHERE is_enabled = TRUE) AS active_connectors,
          COUNT(*) FILTER (WHERE m.received_at >= NOW() - INTERVAL '24 hours')::int AS requests_last_24h,
          COUNT(*) FILTER (WHERE m.received_at >= NOW() - INTERVAL '7 days')::int AS requests_last_7d
        FROM omnichannel_messages m
        LEFT JOIN LATERAL (
          SELECT *
          FROM omnichannel_executions e
          WHERE e.message_id = m.id
          ORDER BY e.created_at DESC
          LIMIT 1
        ) e ON TRUE
        WHERE m.direction = 'INBOUND'
          AND ($1::timestamptz IS NULL OR m.received_at >= $1)
          AND ($2::timestamptz IS NULL OR m.received_at <= $2)
          AND COALESCE(m.metadata ->> 'tenantId', 'default-tenant') = $3
      `,
      overviewParams,
    );

    const channels = await this.databaseService.query<ChannelOverviewRow>(
      `
        SELECT
          m.channel,
          COUNT(*)::int AS total_requests,
          COUNT(*) FILTER (WHERE e.status = 'SUCCESS')::int AS success_count,
          COUNT(*) FILTER (WHERE e.status IN ('FAILED', 'TIMEOUT'))::int AS error_count
        FROM omnichannel_messages m
        LEFT JOIN LATERAL (
          SELECT *
          FROM omnichannel_executions e
          WHERE e.message_id = m.id
          ORDER BY e.created_at DESC
          LIMIT 1
        ) e ON TRUE
        WHERE m.direction = 'INBOUND'
          AND ($1::timestamptz IS NULL OR m.received_at >= $1)
          AND ($2::timestamptz IS NULL OR m.received_at <= $2)
          AND COALESCE(m.metadata ->> 'tenantId', 'default-tenant') = $3
        GROUP BY m.channel
        ORDER BY m.channel ASC
      `,
      overviewParams,
    );

    return {
      totalRequests: overviewRow?.total_requests ?? 0,
      successCount: overviewRow?.success_count ?? 0,
      errorCount: overviewRow?.error_count ?? 0,
      avgLatencyMs: overviewRow?.avg_latency_ms ?? 0,
      p95LatencyMs: overviewRow?.p95_latency_ms ?? 0,
      ragUsagePercentage: overviewRow?.rag_usage_percentage ?? 0,
      activeConnectors: overviewRow?.active_connectors ?? 0,
      requestsLast24h: overviewRow?.requests_last_24h ?? 0,
      requestsLast7d: overviewRow?.requests_last_7d ?? 0,
      channels: channels.map((row) => ({
        channel: row.channel,
        totalRequests: row.total_requests,
        success: row.success_count,
        errors: row.error_count,
      })),
    };
  }

  async listRequests(
    query: ListRequestsQuery,
    tenantId: string,
  ): Promise<PaginatedQueryResult<OmnichannelRequestListItemDto>> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const sortOrder = query.sortOrder ?? 'desc';
    const params = [
      query.channel ?? null,
      query.status ?? null,
      query.startDate ?? null,
      query.endDate ?? null,
      query.conversationId ?? null,
      query.senderId ?? null,
      query.usedRag ?? null,
      tenantId,
      limit,
      offset,
    ];

    const [countRow] = await this.databaseService.query<RequestCountRow>(
      `
        SELECT COUNT(*)::int AS total
        FROM omnichannel_messages m
        LEFT JOIN LATERAL (
          SELECT *
          FROM omnichannel_executions e
          WHERE e.message_id = m.id
          ORDER BY e.created_at DESC
          LIMIT 1
        ) e ON TRUE
        WHERE m.direction = 'INBOUND'
          AND ($1::text IS NULL OR m.channel = $1)
          AND ($2::text IS NULL OR m.status = $2)
          AND ($3::timestamptz IS NULL OR m.received_at >= $3)
          AND ($4::timestamptz IS NULL OR m.received_at <= $4)
          AND ($5::text IS NULL OR m.conversation_id = $5)
          AND ($6::text IS NULL OR m.sender_id = $6)
          AND ($7::boolean IS NULL OR COALESCE(e.used_rag, false) = $7)
          AND COALESCE(m.metadata ->> 'tenantId', 'default-tenant') = $8
      `,
      params.slice(0, 8),
    );

    const rows = await this.databaseService.query<RequestListRow>(
      `
        SELECT
          m.id,
          m.channel,
          m.conversation_id,
          m.sender_name,
          m.sender_address,
          LEFT(m.normalized_text, 160) AS normalized_text_preview,
          m.status,
          m.received_at,
          m.processed_at,
          e.latency_ms,
          COALESCE(e.used_rag, false) AS used_rag
        FROM omnichannel_messages m
        LEFT JOIN LATERAL (
          SELECT *
          FROM omnichannel_executions e
          WHERE e.message_id = m.id
          ORDER BY e.created_at DESC
          LIMIT 1
        ) e ON TRUE
        WHERE m.direction = 'INBOUND'
          AND ($1::text IS NULL OR m.channel = $1)
          AND ($2::text IS NULL OR m.status = $2)
          AND ($3::timestamptz IS NULL OR m.received_at >= $3)
          AND ($4::timestamptz IS NULL OR m.received_at <= $4)
          AND ($5::text IS NULL OR m.conversation_id = $5)
          AND ($6::text IS NULL OR m.sender_id = $6)
          AND ($7::boolean IS NULL OR COALESCE(e.used_rag, false) = $7)
          AND COALESCE(m.metadata ->> 'tenantId', 'default-tenant') = $8
        ORDER BY m.received_at ${sortOrder === 'asc' ? 'ASC' : 'DESC'}
        LIMIT $9 OFFSET $10
      `,
      params,
    );

    return {
      items: rows.map((row) => ({
        id: row.id,
        channel: row.channel,
        conversationId: row.conversation_id,
        senderName: row.sender_name,
        senderAddress: row.sender_address,
        normalizedTextPreview: row.normalized_text_preview,
        status: row.status,
        receivedAt: new Date(row.received_at),
        processedAt: row.processed_at ? new Date(row.processed_at) : null,
        latencyMs: row.latency_ms,
        usedRag: row.used_rag ?? false,
      })),
      total: countRow?.total ?? 0,
      limit,
      offset,
    };
  }

  async getRequestDetails(
    requestId: number,
    tenantId: string,
  ): Promise<OmnichannelRequestDetailsDto | null> {
    const [row] = await this.databaseService.query<RequestDetailsRow>(
      `
        SELECT
          m.id AS message_id,
          m.channel,
          m.direction,
          m.conversation_id,
          m.sender_name,
          m.sender_address,
          m.recipient_address,
          m.subject,
          m.body,
          m.normalized_text,
          m.metadata,
          m.status AS message_status,
          m.received_at,
          m.processed_at,
          e.id AS execution_id,
          e.agent_name,
          e.used_rag,
          e.rag_query,
          e.model_name,
          e.input_tokens,
          e.output_tokens,
          e.latency_ms,
          e.status AS execution_status,
          e.error_message,
          e.started_at,
          e.finished_at
        FROM omnichannel_messages m
        LEFT JOIN LATERAL (
          SELECT *
          FROM omnichannel_executions e
          WHERE e.message_id = m.id
          ORDER BY e.created_at DESC
          LIMIT 1
        ) e ON TRUE
        WHERE m.id = $1
          AND COALESCE(m.metadata ->> 'tenantId', 'default-tenant') = $2
        LIMIT 1
      `,
      [requestId, tenantId],
    );

    if (!row) {
      return null;
    }

    const timeline = await this.getTimelineByMessageId(requestId, tenantId);

    return {
      message: {
        id: row.message_id,
        channel: row.channel,
        direction: row.direction,
        conversationId: row.conversation_id,
        senderName: row.sender_name,
        senderAddress: row.sender_address,
        recipientAddress: row.recipient_address,
        subject: row.subject,
        body: row.body,
        normalizedText: row.normalized_text,
        metadata: row.metadata,
        status: row.message_status,
        receivedAt: new Date(row.received_at),
        processedAt: row.processed_at ? new Date(row.processed_at) : null,
      },
      execution: row.execution_id
        ? {
            executionId: row.execution_id,
            agentName: row.agent_name,
            usedRag: row.used_rag ?? false,
            ragQuery: row.rag_query,
            modelName: row.model_name,
            inputTokens: row.input_tokens,
            outputTokens: row.output_tokens,
            latencyMs: row.latency_ms,
            status: row.execution_status,
            errorMessage: row.error_message,
            startedAt: row.started_at ? new Date(row.started_at) : null,
            finishedAt: row.finished_at ? new Date(row.finished_at) : null,
            timeline,
          }
        : null,
    };
  }

  async listExecutions(
    query: ListExecutionsQuery,
    tenantId: string,
  ): Promise<PaginatedQueryResult<OmnichannelExecutionListItemDto>> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const sortOrder = query.sortOrder ?? 'desc';
    const params = [
      query.channel ?? null,
      query.agentName ?? null,
      query.usedRag ?? null,
      query.status ?? null,
      query.startDate ?? null,
      query.endDate ?? null,
      tenantId,
      limit,
      offset,
    ];

    const [countRow] = await this.databaseService.query<RequestCountRow>(
      `
        SELECT COUNT(*)::int AS total
        FROM omnichannel_executions e
        INNER JOIN omnichannel_messages m ON m.id = e.message_id
        WHERE ($1::text IS NULL OR m.channel = $1)
          AND ($2::text IS NULL OR e.agent_name = $2)
          AND ($3::boolean IS NULL OR e.used_rag = $3)
          AND ($4::text IS NULL OR e.status = $4)
          AND ($5::timestamptz IS NULL OR e.started_at >= $5)
          AND ($6::timestamptz IS NULL OR e.started_at <= $6)
          AND COALESCE(m.metadata ->> 'tenantId', 'default-tenant') = $7
      `,
      params.slice(0, 7),
    );

    const rows = await this.databaseService.query<ExecutionListRow>(
      `
        SELECT
          e.id AS execution_id,
          e.message_id,
          m.channel,
          e.agent_name,
          e.used_rag,
          e.model_name,
          e.latency_ms,
          e.status,
          e.started_at,
          e.finished_at
        FROM omnichannel_executions e
        INNER JOIN omnichannel_messages m ON m.id = e.message_id
        WHERE ($1::text IS NULL OR m.channel = $1)
          AND ($2::text IS NULL OR e.agent_name = $2)
          AND ($3::boolean IS NULL OR e.used_rag = $3)
          AND ($4::text IS NULL OR e.status = $4)
          AND ($5::timestamptz IS NULL OR e.started_at >= $5)
          AND ($6::timestamptz IS NULL OR e.started_at <= $6)
          AND COALESCE(m.metadata ->> 'tenantId', 'default-tenant') = $7
        ORDER BY e.started_at ${sortOrder === 'asc' ? 'ASC' : 'DESC'}
        LIMIT $8 OFFSET $9
      `,
      params,
    );

    return {
      items: rows.map((row) => ({
        executionId: row.execution_id,
        messageId: row.message_id,
        channel: row.channel,
        agentName: row.agent_name,
        usedRag: row.used_rag,
        modelName: row.model_name,
        latencyMs: row.latency_ms,
        status: row.status,
        startedAt: new Date(row.started_at),
        finishedAt: row.finished_at ? new Date(row.finished_at) : null,
      })),
      total: countRow?.total ?? 0,
      limit,
      offset,
    };
  }

  async getExecutionDetails(
    executionId: number,
    tenantId: string,
  ): Promise<OmnichannelExecutionDetailsDto | null> {
    const [row] = await this.databaseService.query<ExecutionDetailsRow>(
      `
        SELECT
          e.id AS execution_id,
          e.agent_name,
          e.used_rag,
          e.rag_query,
          e.model_name,
          e.input_tokens,
          e.output_tokens,
          e.latency_ms,
          e.status,
          e.error_message,
          e.started_at,
          e.finished_at
        FROM omnichannel_executions e
        INNER JOIN omnichannel_messages m ON m.id = e.message_id
        WHERE e.id = $1
          AND COALESCE(m.metadata ->> 'tenantId', 'default-tenant') = $2
        LIMIT 1
      `,
      [executionId, tenantId],
    );

    if (!row) {
      return null;
    }

    const timeline = await this.getTimelineByExecutionId(executionId, tenantId);

    return {
      executionId: row.execution_id,
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
      timeline,
    };
  }

  async getChannelMetrics(
    query: GetChannelMetricsQuery,
    tenantId: string,
  ): Promise<ChannelMetricsDto[]> {
    const params = this.buildPeriodParams(
      query.startDate,
      query.endDate,
      tenantId,
    );
    const rows = await this.databaseService.query<ChannelOverviewRow>(
      `
        SELECT
          m.channel,
          COUNT(*)::int AS total_requests,
          COUNT(*) FILTER (WHERE e.status = 'SUCCESS')::int AS success_count,
          COUNT(*) FILTER (WHERE e.status IN ('FAILED', 'TIMEOUT'))::int AS error_count
        FROM omnichannel_messages m
        LEFT JOIN LATERAL (
          SELECT *
          FROM omnichannel_executions e
          WHERE e.message_id = m.id
          ORDER BY e.created_at DESC
          LIMIT 1
        ) e ON TRUE
        WHERE m.direction = 'INBOUND'
          AND ($1::timestamptz IS NULL OR m.received_at >= $1)
          AND ($2::timestamptz IS NULL OR m.received_at <= $2)
          AND COALESCE(m.metadata ->> 'tenantId', 'default-tenant') = $3
        GROUP BY m.channel
        ORDER BY m.channel ASC
      `,
      params,
    );

    return rows.map((row) => ({
      channel: row.channel,
      totalRequests: row.total_requests,
      successCount: row.success_count,
      errorCount: row.error_count,
    }));
  }

  async getLatencyMetrics(
    query: GetLatencyMetricsQuery,
    tenantId: string,
  ): Promise<LatencyMetricsDto[]> {
    const params = this.buildPeriodParams(
      query.startDate,
      query.endDate,
      tenantId,
    );
    const rows = await this.databaseService.query<LatencyRow>(
      `
        SELECT
          m.channel,
          COALESCE(AVG(e.latency_ms), 0)::int AS avg_latency_ms,
          COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY e.latency_ms), 0)::int AS p95_latency_ms
        FROM omnichannel_executions e
        INNER JOIN omnichannel_messages m ON m.id = e.message_id
        WHERE m.direction = 'INBOUND'
          AND ($1::timestamptz IS NULL OR e.started_at >= $1)
          AND ($2::timestamptz IS NULL OR e.started_at <= $2)
          AND COALESCE(m.metadata ->> 'tenantId', 'default-tenant') = $3
        GROUP BY m.channel
        ORDER BY m.channel ASC
      `,
      params,
    );

    return rows.map((row) => ({
      channel: row.channel,
      avgLatencyMs: row.avg_latency_ms,
      p95LatencyMs: row.p95_latency_ms,
    }));
  }

  async getRagUsageMetrics(
    query: GetRagUsageQuery,
    tenantId: string,
  ): Promise<RagUsageMetricsDto> {
    const params = this.buildPeriodParams(
      query.startDate,
      query.endDate,
      tenantId,
    );
    const [totalsRow] = await this.databaseService.query<RagUsageTotalsRow>(
      `
        SELECT
          COUNT(*)::int AS total_executions,
          COUNT(*) FILTER (WHERE e.used_rag = TRUE)::int AS rag_executions,
          COALESCE(
            ROUND(
              (COUNT(*) FILTER (WHERE e.used_rag = TRUE)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100,
              2
            ),
            0
          )::float AS rag_usage_percentage
        FROM omnichannel_executions e
        INNER JOIN omnichannel_messages m ON m.id = e.message_id
        WHERE m.direction = 'INBOUND'
          AND ($1::timestamptz IS NULL OR e.started_at >= $1)
          AND ($2::timestamptz IS NULL OR e.started_at <= $2)
          AND COALESCE(m.metadata ->> 'tenantId', 'default-tenant') = $3
      `,
      params,
    );

    const byChannel = await this.databaseService.query<RagUsageByChannelRow>(
      `
        SELECT
          m.channel,
          COUNT(*)::int AS total_executions,
          COUNT(*) FILTER (WHERE e.used_rag = TRUE)::int AS rag_executions,
          COALESCE(
            ROUND(
              (COUNT(*) FILTER (WHERE e.used_rag = TRUE)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100,
              2
            ),
            0
          )::float AS rag_usage_percentage
        FROM omnichannel_executions e
        INNER JOIN omnichannel_messages m ON m.id = e.message_id
        WHERE m.direction = 'INBOUND'
          AND ($1::timestamptz IS NULL OR e.started_at >= $1)
          AND ($2::timestamptz IS NULL OR e.started_at <= $2)
          AND COALESCE(m.metadata ->> 'tenantId', 'default-tenant') = $3
        GROUP BY m.channel
        ORDER BY m.channel ASC
      `,
      params,
    );

    return {
      totalExecutions: totalsRow?.total_executions ?? 0,
      ragExecutions: totalsRow?.rag_executions ?? 0,
      ragUsagePercentage: totalsRow?.rag_usage_percentage ?? 0,
      channels: byChannel.map((row) => ({
        channel: row.channel,
        totalExecutions: row.total_executions,
        ragExecutions: row.rag_executions,
        ragUsagePercentage: row.rag_usage_percentage,
      })),
    };
  }

  async listConnectors(query: ListConnectorsQuery): Promise<ConnectorDto[]> {
    const rows = await this.databaseService.query<ConnectorRow>(
      `
        SELECT
          id,
          channel,
          name,
          is_enabled,
          health_status,
          last_health_check_at
        FROM omnichannel_connectors
        WHERE ($1::text IS NULL OR channel = $1)
          AND ($2::boolean IS NULL OR is_enabled = $2)
          AND ($3::text IS NULL OR health_status = $3)
        ORDER BY channel ASC, name ASC
      `,
      [
        query.channel ?? null,
        query.isEnabled ?? null,
        query.healthStatus ?? null,
      ],
    );

    return rows.map((row) => ({
      id: row.id,
      channel: row.channel,
      name: row.name,
      isEnabled: row.is_enabled,
      healthStatus: row.health_status,
      lastHealthCheckAt: row.last_health_check_at
        ? new Date(row.last_health_check_at)
        : null,
    }));
  }

  private buildPeriodParams(
    startDate?: string,
    endDate?: string,
    tenantId = 'default-tenant',
  ): [string | null, string | null, string] {
    return [startDate ?? null, endDate ?? null, tenantId];
  }

  private async getTimelineByMessageId(messageId: number, tenantId: string) {
    const rows = await this.databaseService.query<ExecutionTimelineRow>(
      `
        SELECT
          ev.id,
          ev.event_name,
          ev.metadata,
          ev.occurred_at
        FROM execution_events ev
        INNER JOIN executions ex ON ex.id = ev.execution_id
        INNER JOIN omnichannel_messages m
          ON m.id = ex.source_id
         AND ex.source_type = 'omnichannel_request'
        WHERE ex.source_type = 'omnichannel_request'
          AND ex.source_id = $1
          AND COALESCE(m.metadata ->> 'tenantId', 'default-tenant') = $2
        ORDER BY ev.occurred_at ASC, ev.id ASC
      `,
      [messageId, tenantId],
    );

    return rows.map((row) => ({
      id: row.id,
      eventName: row.event_name,
      metadata: row.metadata,
      occurredAt: new Date(row.occurred_at),
    }));
  }

  private async getTimelineByExecutionId(
    executionId: number,
    tenantId: string,
  ) {
    const [execution] = await this.databaseService.query<{
      message_id: number;
    }>(
      `
        SELECT e.message_id
        FROM omnichannel_executions e
        INNER JOIN omnichannel_messages m ON m.id = e.message_id
        WHERE e.id = $1
          AND COALESCE(m.metadata ->> 'tenantId', 'default-tenant') = $2
        LIMIT 1
      `,
      [executionId, tenantId],
    );

    if (!execution) {
      return [];
    }

    return this.getTimelineByMessageId(execution.message_id, tenantId);
  }
}
