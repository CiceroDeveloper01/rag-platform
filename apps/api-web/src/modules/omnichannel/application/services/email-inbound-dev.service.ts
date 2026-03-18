import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { FeatureFlagsService } from '../../../../common/feature-flags/feature-flags.service';
import { MetricTimer } from '../../../../common/observability/decorators/metric-timer.decorator';
import { Trace } from '../../../../common/observability/decorators/trace.decorator';
import { EmailInboundDevRequest } from '../dtos/request/email-inbound-dev.request';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { DevEmailInboundProvider } from '../../infra/providers/dev-email-inbound-provider.service';
import { EmailInboundProcessingService } from './email-inbound-processing.service';
import { OmnichannelRuntimePolicyService } from './omnichannel-runtime-policy.service';

@Injectable()
export class EmailInboundDevService {
  constructor(
    private readonly configService: ConfigService,
    private readonly devEmailInboundProvider: DevEmailInboundProvider,
    private readonly emailInboundProcessingService: EmailInboundProcessingService,
    private readonly runtimePolicyService: OmnichannelRuntimePolicyService,
    private readonly featureFlagsService: FeatureFlagsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EmailInboundDevService.name);
  }

  @Trace('email.dev.receive')
  @MetricTimer({
    metricName: 'omnichannel_email_inbound_duration_ms',
    labels: { channel: MessageChannel.EMAIL },
  })
  async handleInbound(dto: EmailInboundDevRequest) {
    this.runtimePolicyService.assertApiRuntimeEnabled('email.inbound-dev');

    if (!this.featureFlagsService.isEmailEnabled()) {
      this.featureFlagsService.recordDisabledHit('email', {
        channel: MessageChannel.EMAIL,
        operation: 'dev_inbound',
      });

      return {
        accepted: true,
        disabled: true,
        skipped: true,
        channel: MessageChannel.EMAIL,
      };
    }

    if (!this.configService.get<boolean>('omnichannel.email.enabled', true)) {
      return {
        accepted: true,
        disabled: true,
        skipped: true,
        channel: MessageChannel.EMAIL,
      };
    }

    if (
      this.configService.get<string>('omnichannel.email.provider', 'dev') !==
      'dev'
    ) {
      throw new ServiceUnavailableException(
        'Only the DEV email provider is available',
      );
    }

    if (!this.configService.get<boolean>('omnichannel.email.devMode', true)) {
      throw new ServiceUnavailableException(
        'DEV email inbound mode is disabled',
      );
    }

    try {
      const rawPayload = this.devEmailInboundProvider.createPayload(dto);
      return this.emailInboundProcessingService.processInbound(rawPayload);
    } catch (error) {
      this.logger.error(
        {
          channel: MessageChannel.EMAIL,
          error:
            error instanceof Error ? error.message : 'email_dev_inbound_failed',
        },
        'DEV email inbound processing failed',
      );
      throw error;
    }
  }
}
