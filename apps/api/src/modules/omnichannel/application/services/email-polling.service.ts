import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { EMAIL_PROVIDER } from '../../../../common/email/email.constants';
import type { EmailProvider } from '../../../../common/email/interfaces/email-provider.interface';
import { FeatureFlagsService } from '../../../../common/feature-flags/feature-flags.service';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { EmailInboundProcessingService } from './email-inbound-processing.service';
import { OmnichannelRuntimePolicyService } from './omnichannel-runtime-policy.service';

@Injectable()
export class EmailPollingService implements OnModuleInit, OnModuleDestroy {
  private intervalHandle: NodeJS.Timeout | null = null;
  private pollingInFlight = false;

  constructor(
    private readonly configService: ConfigService,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: EmailProvider,
    private readonly emailInboundProcessingService: EmailInboundProcessingService,
    private readonly runtimePolicyService: OmnichannelRuntimePolicyService,
    private readonly featureFlagsService: FeatureFlagsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EmailPollingService.name);
  }

  onModuleInit(): void {
    if (!this.runtimePolicyService.isApiRuntimeEnabled()) {
      this.logger.info(
        {
          channel: MessageChannel.EMAIL,
        },
        'Skipping API email polling because omnichannel runtime is disabled in the API',
      );
      return;
    }

    if (!this.featureFlagsService.isEmailEnabled()) {
      this.featureFlagsService.recordDisabledHit('email', {
        channel: MessageChannel.EMAIL,
        operation: 'polling_init',
      });
      return;
    }

    if (!this.configService.get<boolean>('omnichannel.email.enabled', true)) {
      return;
    }

    const provider = this.configService.get<string>('email.provider', 'mock');

    if (provider === 'mock' || provider === 'dev') {
      return;
    }

    const pollIntervalSeconds = this.configService.get<number>(
      'email.pollIntervalSeconds',
      30,
    );
    this.intervalHandle = setInterval(
      () => void this.pollInbox(),
      pollIntervalSeconds * 1000,
    );
    void this.pollInbox();
  }

  onModuleDestroy(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  async pollInbox(): Promise<void> {
    if (!this.runtimePolicyService.isApiRuntimeEnabled()) {
      return;
    }

    if (!this.featureFlagsService.isEmailEnabled()) {
      return;
    }

    if (this.pollingInFlight) {
      return;
    }

    this.pollingInFlight = true;

    try {
      const messages = await this.emailProvider.receive();

      for (const message of messages) {
        await this.emailInboundProcessingService.processInbound(message);
      }

      if (messages.length > 0) {
        this.logger.info(
          {
            channel: MessageChannel.EMAIL,
            provider: this.configService.get<string>('email.provider', 'mock'),
            messagesReceived: messages.length,
          },
          'Email polling cycle completed',
        );
      }
    } catch (error) {
      this.logger.error(
        {
          channel: MessageChannel.EMAIL,
          provider: this.configService.get<string>('email.provider', 'mock'),
          error:
            error instanceof Error ? error.message : 'email_polling_failed',
        },
        'Email polling cycle failed',
      );
    } finally {
      this.pollingInFlight = false;
    }
  }
}
