import { TelegramMessageNormalizer } from './telegram-message-normalizer.service';

describe('TelegramMessageNormalizer', () => {
  it('maps a telegram update into the normalized omnichannel payload', () => {
    const service = new TelegramMessageNormalizer();

    const payload = service.normalizeUpdate({
      update_id: 9001,
      message: {
        message_id: 42,
        date: 1_742_000_000,
        text: 'Preciso do manual da plataforma',
        chat: {
          id: 123456,
          type: 'private',
        },
        from: {
          id: 777,
          username: 'cicero',
          first_name: 'Cicero',
          last_name: 'Dev',
        },
      },
    });

    expect(payload.toObject()).toEqual(
      expect.objectContaining({
        externalMessageId: '42',
        conversationId: '123456',
        senderId: '777',
        senderName: 'Cicero Dev',
        senderAddress: 'cicero',
        recipientAddress: '123456',
        body: 'Preciso do manual da plataforma',
      }),
    );
    expect(payload.toObject().metadata).toEqual(
      expect.objectContaining({
        updateId: 9001,
        chatId: 123456,
        username: 'cicero',
      }),
    );
  });
});
