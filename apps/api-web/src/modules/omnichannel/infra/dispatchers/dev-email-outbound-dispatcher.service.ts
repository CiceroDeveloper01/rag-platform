import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { MetricTimer } from '../../../../common/observability/decorators/metric-timer.decorator';
import { Trace } from '../../../../common/observability/decorators/trace.decorator';
import { TraceContextHelper } from '../../../../common/observability/helpers/trace-context.helper';
import { IOutboundDispatcher } from '../../application/interfaces/outbound-dispatcher.interface';
import type {
  OutboundDispatchRequest,
  OutboundDispatchResult,
} from '../../application/interfaces/outbound-dispatcher.interface';
import { OMNICHANNEL_CLOCK_SERVICE } from '../../application/interfaces/clock-service.interface';
import type { IClockService } from '../../application/interfaces/clock-service.interface';
import { OMNICHANNEL_METRICS_SERVICE } from '../../application/interfaces/metrics-service.interface';
import type { IMetricsService } from '../../application/interfaces/metrics-service.interface';
import { OMNICHANNEL_TRACE_SERVICE } from '../../application/interfaces/trace-service.interface';
import type { ITraceService } from '../../application/interfaces/trace-service.interface';
import { MessageChannel } from '../../domain/enums/message-channel.enum';

@Injectable()
export class DevEmailOutboundDispatcher implements IOutboundDispatcher {
  constructor(
    private readonly configService: ConfigService,
    @Inject(OMNICHANNEL_METRICS_SERVICE)
    private readonly metricsService: IMetricsService,
    @Inject(OMNICHANNEL_CLOCK_SERVICE)
    private readonly clockService: IClockService,
    @Inject(OMNICHANNEL_TRACE_SERVICE)
    private readonly traceService: ITraceService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DevEmailOutboundDispatcher.name);
  }

  supports(channel: MessageChannel): boolean {
    return channel === MessageChannel.EMAIL;
  }

  @Trace('omnichannel.email.dispatch')
  @MetricTimer({
    metricName: 'omnichannel_email_dispatch_duration_ms',
    labels: { channel: MessageChannel.EMAIL },
  })
  async dispatch(
    request: OutboundDispatchRequest,
  ): Promise<OutboundDispatchResult> {
    if (!this.configService.get<boolean>('omnichannel.email.enabled', true)) {
      throw new ServiceUnavailableException(
        'Omnichannel email channel is disabled',
      );
    }

    const startedAt = this.clockService.now();
    const traceId =
      this.traceService.getCurrentTraceId() ?? TraceContextHelper.getTraceId();

    try {
      const latencyMs = this.clockService.now().getTime() - startedAt.getTime();
      const fromAddress = this.configService.get<string>(
        'omnichannel.email.from',
        'no-reply@rag-platform.local',
      );

      this.metricsService.recordChannelOutbound(request.channel, 'success');
      this.metricsService.observeDispatchLatency(request.channel, latencyMs);

      this.logger.info(
        {
          channel: request.channel,
          correlationId: request.correlationId,
          traceId,
          messageId: request.message.id,
          dispatcherStatus: 'success',
          transportStatus: 'dev_simulated',
          latencyMs,
          fromAddress,
          toAddress: request.message.toObject().recipientAddress,
          subject: request.message.toObject().subject,
        },
        'DEV email outbound dispatch simulated',
      );
      return {
        accepted: true,
        externalDispatchId: `dev-email-${request.message.id ?? Date.now()}`,
        metadata: {
          provider: 'dev-email',
          fromAddress,
        },
      };
    } catch (error) {
      const latencyMs = this.clockService.now().getTime() - startedAt.getTime();
      this.metricsService.recordChannelOutbound(request.channel, 'error');
      this.metricsService.observeDispatchLatency(request.channel, latencyMs);
      this.logger.error(
        {
          channel: request.channel,
          correlationId: request.correlationId,
          traceId,
          messageId: request.message.id,
          dispatcherStatus: 'error',
          latencyMs,
          error:
            error instanceof Error ? error.message : 'email_dispatch_failed',
        },
        'DEV email outbound dispatch failed',
      );
      throw error;
    }
  }
}
