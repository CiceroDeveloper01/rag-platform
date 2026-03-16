import { OmnichannelMetricSnapshot } from '../entities/omnichannel-metric-snapshot.entity';

export interface IMetricSnapshotRepository {
  refreshDailySnapshot(channel: string): Promise<void>;
  findLatestByChannel(): Promise<OmnichannelMetricSnapshot[]>;
}

export const OMNICHANNEL_METRIC_SNAPSHOT_REPOSITORY = Symbol(
  'OMNICHANNEL_METRIC_SNAPSHOT_REPOSITORY',
);
