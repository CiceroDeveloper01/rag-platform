import { Injectable } from '@nestjs/common';
import { MetricsService } from '../../../../infra/observability/metrics.service';
import { IMetricsService } from '../../application/interfaces/metrics-service.interface';
import { MessageChannel } from '../../domain/enums/message-channel.enum';

@Injectable()
export class OmnichannelMetricsService implements IMetricsService {
  constructor(private readonly metricsService: MetricsService) {}

  recordRequest(channel: MessageChannel, status: 'success' | 'error'): void {
    this.metricsService.recordOmnichannelRequest(channel, status);
  }

  observeLatency(channel: MessageChannel, latencyMs: number): void {
    this.metricsService.observeOmnichannelExecutionLatency(channel, latencyMs);
  }

  recordRagUsage(channel: MessageChannel): void {
    this.metricsService.recordOmnichannelRagUsage(channel);
  }

  recordFailure(channel: MessageChannel): void {
    this.metricsService.recordOmnichannelFailure(channel);
  }

  recordChannelInbound(channel: MessageChannel): void {
    this.metricsService.recordOmnichannelChannelInbound(channel);
  }

  recordChannelOutbound(
    channel: MessageChannel,
    status: 'success' | 'error',
  ): void {
    this.metricsService.recordOmnichannelChannelOutbound(channel, status);
  }

  observeDispatchLatency(channel: MessageChannel, latencyMs: number): void {
    this.metricsService.observeOmnichannelDispatchLatency(channel, latencyMs);
  }

  recordWebhookFailure(channel: MessageChannel): void {
    this.metricsService.recordOmnichannelWebhookFailure(channel);
  }

  recordDashboardQuery(endpoint: string, status: 'success' | 'error'): void {
    this.metricsService.recordOmnichannelDashboardQuery(endpoint, status);
  }

  observeDashboardLatency(endpoint: string, latencyMs: number): void {
    this.metricsService.observeOmnichannelDashboardLatency(endpoint, latencyMs);
  }
}
