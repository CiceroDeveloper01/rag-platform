import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../infra/database/database.service';
import { OmnichannelMetricSnapshot } from '../../domain/entities/omnichannel-metric-snapshot.entity';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { IMetricSnapshotRepository } from '../../domain/repositories/metric-snapshot-repository.interface';

interface MetricSnapshotRow {
  id: number;
  channel: MessageChannel;
  period: string;
  total_requests: number;
  success_count: number;
  error_count: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  created_at: Date;
}

@Injectable()
export class OmnichannelMetricSnapshotPostgresRepository implements IMetricSnapshotRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async refreshDailySnapshot(channel: string): Promise<void> {
    await this.databaseService.query(
      `
        INSERT INTO omnichannel_metric_snapshots (
          channel,
          period,
          total_requests,
          success_count,
          error_count,
          avg_latency_ms,
          p95_latency_ms
        )
        SELECT
          m.channel,
          CURRENT_DATE,
          COUNT(*)::int,
          COUNT(*) FILTER (WHERE e.status = 'SUCCESS')::int,
          COUNT(*) FILTER (WHERE e.status IN ('FAILED', 'TIMEOUT'))::int,
          COALESCE(AVG(e.latency_ms), 0)::int,
          COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY e.latency_ms), 0)::int
        FROM omnichannel_messages m
        LEFT JOIN omnichannel_executions e ON e.message_id = m.id
        WHERE m.channel = $1
          AND DATE(m.created_at) = CURRENT_DATE
        GROUP BY m.channel
        ON CONFLICT (channel, period)
        DO UPDATE SET
          total_requests = EXCLUDED.total_requests,
          success_count = EXCLUDED.success_count,
          error_count = EXCLUDED.error_count,
          avg_latency_ms = EXCLUDED.avg_latency_ms,
          p95_latency_ms = EXCLUDED.p95_latency_ms
      `,
      [channel],
    );
  }

  async findLatestByChannel(): Promise<OmnichannelMetricSnapshot[]> {
    const rows = await this.databaseService.query<MetricSnapshotRow>(
      `
        SELECT DISTINCT ON (channel)
          id,
          channel,
          period::text,
          total_requests,
          success_count,
          error_count,
          avg_latency_ms,
          p95_latency_ms,
          created_at
        FROM omnichannel_metric_snapshots
        ORDER BY channel, period DESC
      `,
    );

    return rows.map(
      (row) =>
        new OmnichannelMetricSnapshot({
          id: row.id,
          channel: row.channel,
          period: row.period,
          totalRequests: row.total_requests,
          successCount: row.success_count,
          errorCount: row.error_count,
          avgLatencyMs: row.avg_latency_ms,
          p95LatencyMs: row.p95_latency_ms,
          createdAt: new Date(row.created_at),
        }),
    );
  }
}
