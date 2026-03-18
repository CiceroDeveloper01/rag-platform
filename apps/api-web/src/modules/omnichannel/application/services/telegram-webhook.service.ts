import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { FeatureFlagsService } from '../../../../common/feature-flags/feature-flags.service';
import { MetricTimer } from '../../../../common/observability/decorators/metric-timer.decorator';
import { Trace } from '../../../../common/observability/decorators/trace.decorator';
import { TraceContextHelper } from '../../../../common/observability/helpers/trace-context.helper';
import { OMNICHANNEL_METRICS_SERVICE } from '../interfaces/metrics-service.interface';
import type { IMetricsService } from '../interfaces/metrics-service.interface';
import { OMNICHANNEL_TRACE_SERVICE } from '../interfaces/trace-service.interface';
import type { ITraceService } from '../interfaces/trace-service.interface';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { TelegramWebhookRequest } from '../dtos/request/telegram-webhook.request';
import { DefaultChannelAdapterRegistryService } from '../../infra/providers/default-channel-adapter-registry.service';
import { OmnichannelOrchestratorService } from './omnichannel-orchestrator.service';
import { IdempotencyService } from './idempotency.service';
import { OmnichannelRuntimePolicyService } from './omnichannel-runtime-policy.service';

@Injectable()
export class TelegramWebhookService {
  constructor(
    private readonly configService: ConfigService,
    private readonly adapterRegistry: DefaultChannelAdapterRegistryService,
    private readonly orchestratorService: OmnichannelOrchestratorService,
    private readonly runtimePolicyService: OmnichannelRuntimePolicyService,
    private readonly idempotencyService: IdempotencyService,
    private readonly featureFlagsService: FeatureFlagsService,
    @Inject(OMNICHANNEL_METRICS_SERVICE)
    private readonly metricsService: IMetricsService,
    @Inject(OMNICHANNEL_TRACE_SERVICE)
    private readonly traceService: ITraceService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TelegramWebhookService.name);
  }

  @Trace('telegram.webhook.receive')
  @MetricTimer({
    metricName: 'omnichannel_telegram_webhook_duration_ms',
    labels: { channel: MessageChannel.TELEGRAM },
  })
  async handleWebhook(dto: TelegramWebhookRequest, secret?: string) {
    this.runtimePolicyService.assertApiRuntimeEnabled('telegram.webhook');

    if (!this.featureFlagsService.isTelegramEnabled()) {
      this.featureFlagsService.recordDisabledHit('telegram', {
        channel: MessageChannel.TELEGRAM,
        operation: 'webhook',
      });

      return {
        accepted: true,
        disabled: true,
        skipped: true,
        channel: MessageChannel.TELEGRAM,
      };
    }

    if (
      !this.configService.get<boolean>('omnichannel.telegram.enabled', true)
    ) {
      return {
        accepted: true,
        disabled: true,
        skipped: true,
        channel: MessageChannel.TELEGRAM,
      };
    }

    const configuredSecret = this.configService.get<string>(
      'omnichannel.telegram.webhookSecret',
      '',
    );

    if (configuredSecret && configuredSecret !== secret) {
      throw new UnauthorizedException('Invalid Telegram webhook secret');
    }

    if (!dto.message?.text?.trim()) {
      throw new BadRequestException('Telegram text messages are required');
    }

    const traceId =
      this.traceService.getCurrentTraceId() ?? TraceContextHelper.getTraceId();

    try {
      this.metricsService.recordChannelInbound(MessageChannel.TELEGRAM);

      const normalizedPayload = await this.traceService.runInChildSpan(
        traceId ?? String(dto.update_id),
        'telegram.normalize',
        async () =>
          this.adapterRegistry.normalizeForChannel(
            MessageChannel.TELEGRAM,
            dto,
          ),
        { updateId: dto.update_id },
      );

      const externalMessageId =
        normalizedPayload.toObject().externalMessageId ?? undefined;

      if (externalMessageId) {
        const shouldProcess = await this.idempotencyService.register(
          MessageChannel.TELEGRAM,
          externalMessageId,
          dto as unknown as Record<string, unknown>,
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
        channel: MessageChannel.TELEGRAM,
        externalMessageId,
        conversationId:
          normalizedPayload.toObject().conversationId ?? undefined,
        senderId: normalizedPayload.toObject().senderId ?? undefined,
        senderName: normalizedPayload.toObject().senderName ?? undefined,
        senderAddress: normalizedPayload.toObject().senderAddress ?? undefined,
        recipientAddress:
          normalizedPayload.toObject().recipientAddress ?? undefined,
        subject: normalizedPayload.toObject().subject ?? undefined,
        body: normalizedPayload.toObject().body,
        metadata: normalizedPayload.toObject().metadata ?? undefined,
      });

      this.logger.info({
        channel: MessageChannel.TELEGRAM,
        externalMessageId: normalizedPayload.toObject().externalMessageId,
        conversationId: normalizedPayload.toObject().conversationId,
        traceId,
        status: 'processed',
      });

      return result;
    } catch (error) {
      this.metricsService.recordWebhookFailure(MessageChannel.TELEGRAM);
      this.logger.error(
        {
          channel: MessageChannel.TELEGRAM,
          traceId,
          error:
            error instanceof Error ? error.message : 'telegram_webhook_failed',
        },
        'Telegram webhook processing failed',
      );
      throw error;
    }
  }
}
