import { TelegramOutboundDispatcher } from './telegram-outbound-dispatcher.service';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { OmnichannelMessage } from '../../domain/entities/omnichannel-message.entity';

describe('TelegramOutboundDispatcher', () => {
  const metricsService = {
    recordChannelOutbound: jest.fn(),
    observeDispatchLatency: jest.fn(),
  };
  const clockService = {
    now: jest.fn(),
  };
  const traceService = {
    startSpan: jest.fn().mockReturnValue({
      traceId: 'trace-telegram',
      spanId: 'span-telegram',
      end: jest.fn(),
    }),
    getCurrentTraceId: jest.fn().mockReturnValue('trace-telegram'),
  };
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    clockService.now
      .mockReturnValueOnce(new Date('2026-03-13T10:00:00.000Z'))
      .mockReturnValueOnce(new Date('2026-03-13T10:00:00.150Z'));
  });

  it('dispatches a telegram response through the API client', async () => {
    const telegramApiClient = {
      sendMessage: jest.fn().mockResolvedValue({
        ok: true,
        result: {
          message_id: 999,
          chat: {
            id: 123,
          },
        },
      }),
    };

    const service = new TelegramOutboundDispatcher(
      telegramApiClient as never,
      metricsService as never,
      clockService as never,
      traceService as never,
      logger as never,
    );

    const result = await service.dispatch({
      channel: MessageChannel.TELEGRAM,
      correlationId: 'corr-1',
      message: OmnichannelMessage.createOutbound({
        channel: MessageChannel.TELEGRAM,
        conversationId: '123',
        recipientAddress: '123',
        body: 'Resposta Telegram',
        normalizedText: 'Resposta Telegram',
      }),
    });

    expect(telegramApiClient.sendMessage).toHaveBeenCalledWith({
      chatId: '123',
      text: 'Resposta Telegram',
    });
    expect(result.accepted).toBe(true);
    expect(result.externalDispatchId).toBe('999');
  });

  it('propagates telegram transport failures', async () => {
    const telegramApiClient = {
      sendMessage: jest
        .fn()
        .mockRejectedValue(new Error('telegram unavailable')),
    };

    const service = new TelegramOutboundDispatcher(
      telegramApiClient as never,
      metricsService as never,
      clockService as never,
      traceService as never,
      logger as never,
    );

    await expect(
      service.dispatch({
        channel: MessageChannel.TELEGRAM,
        correlationId: 'corr-2',
        message: OmnichannelMessage.createOutbound({
          channel: MessageChannel.TELEGRAM,
          conversationId: '456',
          recipientAddress: '456',
          body: 'Falha',
          normalizedText: 'Falha',
        }),
      }),
    ).rejects.toThrow('telegram unavailable');
  });
});
