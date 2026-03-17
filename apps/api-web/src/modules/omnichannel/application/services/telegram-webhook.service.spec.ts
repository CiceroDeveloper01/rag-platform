import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { FeatureFlagsService } from '../../../../common/feature-flags/feature-flags.service';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { TelegramWebhookService } from './telegram-webhook.service';
import { DefaultChannelAdapterRegistryService } from '../../infra/providers/default-channel-adapter-registry.service';
import { OmnichannelOrchestratorService } from './omnichannel-orchestrator.service';
import { IdempotencyService } from './idempotency.service';
import { OmnichannelRuntimePolicyService } from './omnichannel-runtime-policy.service';
import { OMNICHANNEL_METRICS_SERVICE } from '../interfaces/metrics-service.interface';
import { OMNICHANNEL_TRACE_SERVICE } from '../interfaces/trace-service.interface';

describe('TelegramWebhookService', () => {
  it('does not process the webhook when Telegram is disabled by feature flag', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TelegramWebhookService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: DefaultChannelAdapterRegistryService,
          useValue: {
            normalizeForChannel: jest.fn(),
          },
        },
        {
          provide: OmnichannelOrchestratorService,
          useValue: {
            process: jest.fn(),
          },
        },
        {
          provide: OmnichannelRuntimePolicyService,
          useValue: {
            assertApiRuntimeEnabled: jest.fn(),
          },
        },
        {
          provide: IdempotencyService,
          useValue: {
            register: jest.fn(),
          },
        },
        {
          provide: FeatureFlagsService,
          useValue: {
            isTelegramEnabled: jest.fn().mockReturnValue(false),
            recordDisabledHit: jest.fn(),
          },
        },
        {
          provide: OMNICHANNEL_METRICS_SERVICE,
          useValue: {
            recordChannelInbound: jest.fn(),
            recordWebhookFailure: jest.fn(),
          },
        },
        {
          provide: OMNICHANNEL_TRACE_SERVICE,
          useValue: {
            getCurrentTraceId: jest.fn(),
            runInChildSpan: jest.fn(),
          },
        },
        {
          provide: PinoLogger,
          useValue: {
            setContext: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(TelegramWebhookService);

    const result = await service.handleWebhook({
      update_id: 1,
      message: {
        message_id: 2,
        date: 1710000000,
        text: 'hello',
        chat: {
          id: 3,
          type: 'private',
        },
      },
    });

    expect(result).toEqual({
      accepted: true,
      disabled: true,
      skipped: true,
      channel: MessageChannel.TELEGRAM,
    });
  });

  it('fails fast when API runtime is disabled', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TelegramWebhookService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: DefaultChannelAdapterRegistryService,
          useValue: {
            normalizeForChannel: jest.fn(),
          },
        },
        {
          provide: OmnichannelOrchestratorService,
          useValue: {
            process: jest.fn(),
          },
        },
        {
          provide: OmnichannelRuntimePolicyService,
          useValue: {
            assertApiRuntimeEnabled: jest.fn().mockImplementation(() => {
              throw new Error('api runtime disabled');
            }),
          },
        },
        {
          provide: IdempotencyService,
          useValue: {
            register: jest.fn(),
          },
        },
        {
          provide: FeatureFlagsService,
          useValue: {
            isTelegramEnabled: jest.fn().mockReturnValue(true),
            recordDisabledHit: jest.fn(),
          },
        },
        {
          provide: OMNICHANNEL_METRICS_SERVICE,
          useValue: {
            recordChannelInbound: jest.fn(),
            recordWebhookFailure: jest.fn(),
          },
        },
        {
          provide: OMNICHANNEL_TRACE_SERVICE,
          useValue: {
            getCurrentTraceId: jest.fn(),
            runInChildSpan: jest.fn(),
          },
        },
        {
          provide: PinoLogger,
          useValue: {
            setContext: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(TelegramWebhookService);

    await expect(
      service.handleWebhook({
        update_id: 1,
        message: {
          message_id: 2,
          date: 1710000000,
          text: 'hello',
          chat: {
            id: 3,
            type: 'private',
          },
        },
      }),
    ).rejects.toThrow('api runtime disabled');
  });
});
