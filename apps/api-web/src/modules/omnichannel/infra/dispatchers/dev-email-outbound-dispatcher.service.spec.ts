import { ConfigService } from '@nestjs/config';
import { DevEmailOutboundDispatcher } from './dev-email-outbound-dispatcher.service';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { OmnichannelMessage } from '../../domain/entities/omnichannel-message.entity';

describe('DevEmailOutboundDispatcher', () => {
  const metricsService = {
    recordChannelOutbound: jest.fn(),
    observeDispatchLatency: jest.fn(),
  };
  const clockService = {
    now: jest
      .fn()
      .mockReturnValueOnce(new Date('2026-03-13T10:00:00.000Z'))
      .mockReturnValueOnce(new Date('2026-03-13T10:00:00.010Z')),
  };
  const traceService = {
    startSpan: jest.fn().mockReturnValue({
      traceId: 'trace-email',
      spanId: 'span-email',
      end: jest.fn(),
    }),
    getCurrentTraceId: jest.fn().mockReturnValue('trace-email'),
  };
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('simulates an email outbound dispatch in dev mode', async () => {
    const service = new DevEmailOutboundDispatcher(
      {
        get: jest.fn((key: string, fallback?: unknown) => {
          const values: Record<string, unknown> = {
            'omnichannel.email.enabled': true,
            'omnichannel.email.from': 'no-reply@rag-platform.local',
          };

          return values[key] ?? fallback;
        }),
      } as unknown as ConfigService,
      metricsService as never,
      clockService as never,
      traceService as never,
      logger as never,
    );

    const result = await service.dispatch({
      channel: MessageChannel.EMAIL,
      correlationId: 'corr-1',
      message: OmnichannelMessage.createOutbound({
        channel: MessageChannel.EMAIL,
        recipientAddress: 'user@example.com',
        subject: 'Resposta',
        body: 'Resposta por email',
        normalizedText: 'Resposta por email',
      }),
    });

    expect(result.accepted).toBe(true);
    expect(result.metadata).toEqual(
      expect.objectContaining({
        provider: 'dev-email',
      }),
    );
  });

  it('fails when the email channel is disabled', async () => {
    const service = new DevEmailOutboundDispatcher(
      {
        get: jest.fn((key: string, fallback?: unknown) => {
          const values: Record<string, unknown> = {
            'omnichannel.email.enabled': false,
          };

          return values[key] ?? fallback;
        }),
      } as unknown as ConfigService,
      metricsService as never,
      clockService as never,
      traceService as never,
      logger as never,
    );

    await expect(
      service.dispatch({
        channel: MessageChannel.EMAIL,
        correlationId: 'corr-1',
        message: OmnichannelMessage.createOutbound({
          channel: MessageChannel.EMAIL,
          recipientAddress: 'user@example.com',
          body: 'Resposta por email',
          normalizedText: 'Resposta por email',
        }),
      }),
    ).rejects.toThrow('Omnichannel email channel is disabled');
  });
});
