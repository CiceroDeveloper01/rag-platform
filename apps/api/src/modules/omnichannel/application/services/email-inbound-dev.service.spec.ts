import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { FeatureFlagsService } from '../../../../common/feature-flags/feature-flags.service';
import { DevEmailInboundProvider } from '../../infra/providers/dev-email-inbound-provider.service';
import { EmailInboundProcessingService } from './email-inbound-processing.service';
import { EmailInboundDevService } from './email-inbound-dev.service';
import { OmnichannelRuntimePolicyService } from './omnichannel-runtime-policy.service';

describe('EmailInboundDevService', () => {
  it('fails fast when API runtime is disabled', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        EmailInboundDevService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: DevEmailInboundProvider,
          useValue: {
            createPayload: jest.fn(),
          },
        },
        {
          provide: EmailInboundProcessingService,
          useValue: {
            processInbound: jest.fn(),
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
          provide: FeatureFlagsService,
          useValue: {
            isEmailEnabled: jest.fn().mockReturnValue(true),
            recordDisabledHit: jest.fn(),
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

    const service = moduleRef.get(EmailInboundDevService);

    await expect(
      service.handleInbound({
        fromEmail: 'user@example.com',
        subject: 'hello',
        body: 'world',
      }),
    ).rejects.toThrow('api runtime disabled');
  });
});
