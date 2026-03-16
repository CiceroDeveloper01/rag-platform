import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { OmnichannelRuntimePolicyService } from './omnichannel-runtime-policy.service';

describe('OmnichannelRuntimePolicyService', () => {
  it('throws when API runtime is disabled', () => {
    const service = new OmnichannelRuntimePolicyService({
      get: jest.fn().mockReturnValue(false),
    } as unknown as ConfigService);

    expect(() => service.assertApiRuntimeEnabled('telegram.webhook')).toThrow(
      ServiceUnavailableException,
    );
  });

  it('allows execution when API runtime is enabled', () => {
    const service = new OmnichannelRuntimePolicyService({
      get: jest.fn().mockReturnValue(true),
    } as unknown as ConfigService);

    expect(() =>
      service.assertApiRuntimeEnabled('telegram.webhook'),
    ).not.toThrow();
  });
});
