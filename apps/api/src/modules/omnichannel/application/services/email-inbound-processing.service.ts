import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { InboundEmailMessage } from '../../../../common/email/interfaces/email-provider.interface';
import { FeatureFlagsService } from '../../../../common/feature-flags/feature-flags.service';
import { MetricTimer } from '../../../../common/observability/decorators/metric-timer.decorator';
import { Trace } from '../../../../common/observability/decorators/trace.decorator';
import { TraceContextHelper } from '../../../../common/observability/helpers/trace-context.helper';
import { OMNICHANNEL_METRICS_SERVICE } from '../interfaces/metrics-service.interface';
import type { IMetricsService } from '../interfaces/metrics-service.interface';
import { OMNICHANNEL_TRACE_SERVICE } from '../interfaces/trace-service.interface';
import type { ITraceService } from '../interfaces/trace-service.interface';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { DefaultChannelAdapterRegistryService } from '../../infra/providers/default-channel-adapter-registry.service';
import { OmnichannelOrchestratorService } from './omnichannel-orchestrator.service';
import { MetricsService } from '../../../../infra/observability/metrics.service';
import { IdempotencyService } from './idempotency.service';

@Injectable()
export class EmailInboundProcessingService {
  constructor(
    private readonly adapterRegistry: DefaultChannelAdapterRegistryService,
    private readonly orchestratorService: OmnichannelOrchestratorService,
    private readonly idempotencyService: IdempotencyService,
    private readonly featureFlagsService: FeatureFlagsService,
    @Inject(OMNICHANNEL_METRICS_SERVICE)
    private readonly metricsService: IMetricsService,
    @Inject(OMNICHANNEL_TRACE_SERVICE)
    private readonly traceService: ITraceService,
    private readonly platformMetricsService: MetricsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EmailInboundProcessingService.name);
  }

  @Trace('email.provider.receive')
  @MetricTimer({
    metricName: 'email_provider_processing_duration_ms',
    labels: { channel: MessageChannel.EMAIL },
  })
  async processInbound(payload: InboundEmailMessage) {
    const startedAt = Date.now();
    const traceId =
      this.traceService.getCurrentTraceId() ?? TraceContextHelper.getTraceId();
    const provider = payload.provider ?? 'unknown';

    if (!this.featureFlagsService.isEmailEnabled()) {
      this.featureFlagsService.recordDisabledHit('email', {
        channel: MessageChannel.EMAIL,
        operation: 'inbound_processing',
        provider,
      });

      return {
        accepted: true,
        disabled: true,
        skipped: true,
        channel: MessageChannel.EMAIL,
      };
    }

    try {
      this.metricsService.recordChannelInbound(MessageChannel.EMAIL);
      this.platformMetricsService.incrementCustomCounter(
        'email_messages_received_total',
        {
          provider,
        },
      );

      const normalizedPayload = await this.traceService.runInChildSpan(
        traceId ?? payload.fromEmail,
        'email.parse',
        async () =>
          this.adapterRegistry.normalizeForChannel(
            MessageChannel.EMAIL,
            payload,
          ),
        { provider },
      );

      const externalMessageId =
        normalizedPayload.toObject().externalMessageId ?? undefined;

      if (externalMessageId) {
        const shouldProcess = await this.idempotencyService.register(
          MessageChannel.EMAIL,
          externalMessageId,
          payload as unknown as Record<string, unknown>,
        );

        if (!shouldProcess) {
          return {
            accepted: true,
            duplicate: true,
            skipped: true,
            externalMessageId,
          };
        }
      }

      const result = await this.orchestratorService.process({
        channel: MessageChannel.EMAIL,
        externalMessageId,
        conversationId:
          normalizedPayload.toObject().conversationId ?? undefined,
        senderName: normalizedPayload.toObject().senderName ?? undefined,
        senderAddress: normalizedPayload.toObject().senderAddress ?? undefined,
        recipientAddress:
          normalizedPayload.toObject().recipientAddress ?? undefined,
        subject: normalizedPayload.toObject().subject ?? undefined,
        body: normalizedPayload.toObject().body,
        metadata: normalizedPayload.toObject().metadata ?? undefined,
      });

      this.platformMetricsService.observeCustomHistogram(
        'email_processing_duration_ms',
        Date.now() - startedAt,
        { provider },
      );

      this.logger.info(
        {
          provider,
          externalMessageId: payload.externalMessageId,
          conversationId: normalizedPayload.toObject().conversationId,
          traceId,
          status: 'processed',
        },
        'Email inbound payload processed successfully',
      );

      return result;
    } catch (error) {
      this.metricsService.recordWebhookFailure(MessageChannel.EMAIL);
      this.platformMetricsService.observeCustomHistogram(
        'email_processing_duration_ms',
        Date.now() - startedAt,
        { provider },
      );
      this.logger.error(
        {
          provider,
          traceId,
          error:
            error instanceof Error
              ? error.message
              : 'email_inbound_processing_failed',
        },
        'Email inbound payload processing failed',
      );
      throw error;
    }
  }
}
