import { ServiceUnavailableException } from '@nestjs/common';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { DefaultChannelAdapterRegistryService } from './default-channel-adapter-registry.service';

describe('DefaultChannelAdapterRegistryService', () => {
  it('routes normalization to the registered adapter for the channel', () => {
    const telegramAdapter = {
      supports: jest.fn(
        (channel: MessageChannel) => channel === MessageChannel.TELEGRAM,
      ),
      normalize: jest.fn().mockReturnValue('normalized-telegram'),
    };
    const fallbackAdapter = {
      supports: jest.fn().mockReturnValue(false),
      normalize: jest.fn(),
    };

    const registry = new DefaultChannelAdapterRegistryService(
      telegramAdapter as never,
      fallbackAdapter as never,
      fallbackAdapter as never,
      fallbackAdapter as never,
      fallbackAdapter as never,
      fallbackAdapter as never,
      fallbackAdapter as never,
      fallbackAdapter as never,
    );

    expect(
      registry.normalizeForChannel(MessageChannel.TELEGRAM, { raw: true }),
    ).toBe('normalized-telegram');
  });

  it('fails when no adapter is registered for the channel', () => {
    const unsupportedAdapter = {
      supports: jest.fn().mockReturnValue(false),
      normalize: jest.fn(),
    };

    const registry = new DefaultChannelAdapterRegistryService(
      unsupportedAdapter as never,
      unsupportedAdapter as never,
      unsupportedAdapter as never,
      unsupportedAdapter as never,
      unsupportedAdapter as never,
      unsupportedAdapter as never,
      unsupportedAdapter as never,
      unsupportedAdapter as never,
    );

    expect(() =>
      registry.normalizeForChannel(MessageChannel.EMAIL, {
        raw: true,
      }),
    ).toThrow(ServiceUnavailableException);
  });
});
