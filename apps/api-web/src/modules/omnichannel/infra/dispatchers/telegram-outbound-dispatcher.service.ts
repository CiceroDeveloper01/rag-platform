import { Injectable } from '@nestjs/common';
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
import { TelegramApiClient } from '../providers/telegram-api-client.service';
import { Inject } from '@nestjs/common';

@Injectable()
export class TelegramOutboundDispatcher implements IOutboundDispatcher {
  constructor(
    private readonly telegramApiClient: TelegramApiClient,
    @Inject(OMNICHANNEL_METRICS_SERVICE)
    private readonly metricsService: IMetricsService,
    @Inject(OMNICHANNEL_CLOCK_SERVICE)
    private readonly clockService: IClockService,
    @Inject(OMNICHANNEL_TRACE_SERVICE)
    private readonly traceService: ITraceService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TelegramOutboundDispatcher.name);
  }

  supports(channel: MessageChannel): boolean {
    return channel === MessageChannel.TELEGRAM;
  }

  @Trace('omnichannel.telegram.dispatch')
  @MetricTimer({
    metricName: 'omnichannel_telegram_dispatch_duration_ms',
    labels: { channel: MessageChannel.TELEGRAM },
  })
  async dispatch(
    request: OutboundDispatchRequest,
  ): Promise<OutboundDispatchResult> {
    const startedAt = this.clockService.now();
    const traceId =
      this.traceService.getCurrentTraceId() ?? TraceContextHelper.getTraceId();

    try {
      const chatId = request.message.toObject().recipientAddress;
      const result = await this.telegramApiClient.sendMessage({
        chatId: chatId ?? request.message.toObject().conversationId ?? '',
        text: request.message.body,
      });
      const latencyMs = this.clockService.now().getTime() - startedAt.getTime();
      this.metricsService.recordChannelOutbound(request.channel, 'success');
      this.metricsService.observeDispatchLatency(request.channel, latencyMs);

      this.logger.info({
        channel: request.channel,
        correlationId: request.correlationId,
        traceId,
        messageId: request.message.id,
        dispatcherStatus: 'success',
        transportStatus: result.ok ? 'ok' : 'accepted',
        latencyMs,
      });

      return {
        accepted: true,
        externalDispatchId: result.result?.message_id
          ? String(result.result.message_id)
          : null,
        metadata: {
          chatId: result.result?.chat?.id ?? chatId,
          provider: 'telegram',
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
            error instanceof Error ? error.message : 'telegram_dispatch_failed',
        },
        'Telegram outbound dispatch failed',
      );
      throw error;
    }
  }
}
