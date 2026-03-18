import { MessageChannel } from '../enums/message-channel.enum';

export interface OmnichannelMetricSnapshotProps {
  id?: number;
  channel: MessageChannel;
  period: string;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  createdAt?: Date;
}

export class OmnichannelMetricSnapshot {
  constructor(private readonly props: OmnichannelMetricSnapshotProps) {}

  toObject(): OmnichannelMetricSnapshotProps {
    return { ...this.props };
  }
}
