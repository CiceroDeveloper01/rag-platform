import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { EMAIL_PROVIDER } from '../../../../common/email/email.constants';
import type { EmailProvider } from '../../../../common/email/interfaces/email-provider.interface';
import { MetricTimer } from '../../../../common/observability/decorators/metric-timer.decorator';
import { Trace } from '../../../../common/observability/decorators/trace.decorator';
import { TraceContextHelper } from '../../../../common/observability/helpers/trace-context.helper';
import { MetricsService } from '../../../../infra/observability/metrics.service';
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
export class EmailOutboundDispatcher implements IOutboundDispatcher {
  constructor(
    private readonly configService: ConfigService,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: EmailProvider,
    @Inject(OMNICHANNEL_METRICS_SERVICE)
    private readonly metricsService: IMetricsService,
    @Inject(OMNICHANNEL_CLOCK_SERVICE)
    private readonly clockService: IClockService,
    @Inject(OMNICHANNEL_TRACE_SERVICE)
    private readonly traceService: ITraceService,
    private readonly platformMetricsService: MetricsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EmailOutboundDispatcher.name);
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
    const provider = this.configService.get<string>('email.provider', 'mock');

    try {
      const result = await this.emailProvider.send({
        from: this.configService.get<string>(
          'email.fromAddress',
          'no-reply@rag-platform.local',
        ),
        to: request.message.toObject().recipientAddress ?? '',
        subject: request.message.toObject().subject ?? 'RAG Platform response',
        text: request.message.toObject().body,
        metadata: {
          correlationId: request.correlationId,
        },
      });

      const latencyMs = this.clockService.now().getTime() - startedAt.getTime();
      this.metricsService.recordChannelOutbound(
        request.channel,
        result.accepted ? 'success' : 'error',
      );
      this.metricsService.observeDispatchLatency(request.channel, latencyMs);
      this.platformMetricsService.incrementCustomCounter(
        'email_messages_sent_total',
        {
          provider,
          status: result.accepted ? 'success' : 'error',
        },
      );

      this.logger.info(
        {
          channel: request.channel,
          provider,
          correlationId: request.correlationId,
          traceId,
          messageId: request.message.id,
          dispatcherStatus: result.accepted ? 'success' : 'error',
          latencyMs,
        },
        'Email outbound dispatch completed',
      );

      return {
        accepted: result.accepted,
        externalDispatchId: result.externalId,
        metadata: result.metadata,
      };
    } catch (error) {
      const latencyMs = this.clockService.now().getTime() - startedAt.getTime();
      this.metricsService.recordChannelOutbound(request.channel, 'error');
      this.metricsService.observeDispatchLatency(request.channel, latencyMs);
      this.platformMetricsService.incrementCustomCounter(
        'email_messages_sent_total',
        {
          provider,
          status: 'error',
        },
      );
      this.logger.error(
        {
          channel: request.channel,
          provider,
          correlationId: request.correlationId,
          traceId,
          latencyMs,
          error:
            error instanceof Error ? error.message : 'email_dispatch_failed',
        },
        'Email outbound dispatch failed',
      );
      throw error;
    }
  }
}
