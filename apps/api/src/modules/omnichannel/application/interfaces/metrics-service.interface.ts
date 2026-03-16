import { MessageChannel } from '../../domain/enums/message-channel.enum';

export interface IMetricsService {
  recordRequest(channel: MessageChannel, status: 'success' | 'error'): void;
  observeLatency(channel: MessageChannel, latencyMs: number): void;
  recordRagUsage(channel: MessageChannel): void;
  recordFailure(channel: MessageChannel): void;
  recordChannelInbound(channel: MessageChannel): void;
  recordChannelOutbound(
    channel: MessageChannel,
    status: 'success' | 'error',
  ): void;
  observeDispatchLatency(channel: MessageChannel, latencyMs: number): void;
  recordWebhookFailure(channel: MessageChannel): void;
  recordDashboardQuery(endpoint: string, status: 'success' | 'error'): void;
  observeDashboardLatency(endpoint: string, latencyMs: number): void;
}

export const OMNICHANNEL_METRICS_SERVICE = Symbol(
  'OMNICHANNEL_METRICS_SERVICE',
);
