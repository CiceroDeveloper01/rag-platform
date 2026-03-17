import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailInboundDevDto } from '../src/modules/omnichannel/application/dto/email-inbound-dev.dto';
import { TelegramWebhookDto } from '../src/modules/omnichannel/application/dto/telegram-webhook.dto';
import { EmailInboundDevService } from '../src/modules/omnichannel/application/services/email-inbound-dev.service';
import { TelegramWebhookService } from '../src/modules/omnichannel/application/services/telegram-webhook.service';
import { EmailInboundDevController } from '../src/modules/omnichannel/presentation/controllers/email-inbound-dev.controller';
import { TelegramWebhookController } from '../src/modules/omnichannel/presentation/controllers/telegram-webhook.controller';

describe('Omnichannel channel endpoints integration', () => {
  let moduleRef: TestingModule;
  let telegramController: TelegramWebhookController;
  let emailController: EmailInboundDevController;
  const telegramWebhookService = {
    handleWebhook: jest.fn(),
  };
  const emailInboundDevService = {
    handleInbound: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    telegramWebhookService.handleWebhook.mockResolvedValue({
      executionId: 10,
      dispatchAccepted: true,
    });
    emailInboundDevService.handleInbound.mockResolvedValue({
      executionId: 20,
      dispatchAccepted: true,
    });

    moduleRef = await Test.createTestingModule({
      controllers: [TelegramWebhookController, EmailInboundDevController],
      providers: [
        {
          provide: TelegramWebhookService,
          useValue: telegramWebhookService,
        },
        {
          provide: EmailInboundDevService,
          useValue: emailInboundDevService,
        },
      ],
    }).compile();

    telegramController = moduleRef.get(TelegramWebhookController);
    emailController = moduleRef.get(EmailInboundDevController);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('maps POST /api/v1/omnichannel/telegram/webhook to the telegram ingress service', async () => {
    await expect(
      telegramController.handleWebhook({
        update_id: 1,
        message: {
          message_id: 10,
          date: 1_742_000_000,
          text: 'Oi',
          chat: {
            id: 123,
            type: 'private',
          },
        },
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        executionId: 10,
      }),
    );
  });

  it('maps POST /api/v1/omnichannel/email/inbound-dev to the dev email ingress service', async () => {
    await expect(
      emailController.handleInbound({
        fromEmail: 'user@example.com',
        toEmail: 'support@example.com',
        body: 'Preciso da politica',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        executionId: 20,
      }),
    );
  });

  it('propagates telegram processing failures from the channel service', async () => {
    telegramWebhookService.handleWebhook.mockRejectedValueOnce(
      new Error('dispatch failed'),
    );

    await expect(
      telegramController.handleWebhook({
        update_id: 1,
        message: {
          message_id: 10,
          date: 1_742_000_000,
          text: 'Oi',
          chat: {
            id: 123,
            type: 'private',
          },
        },
      }),
    ).rejects.toThrow('dispatch failed');
  });

  it('propagates dev email processing failures from the channel service', async () => {
    emailInboundDevService.handleInbound.mockRejectedValueOnce(
      new Error('orchestrator failed'),
    );

    await expect(
      emailController.handleInbound({
        fromEmail: 'user@example.com',
        toEmail: 'support@example.com',
        body: 'Preciso da politica',
      }),
    ).rejects.toThrow('orchestrator failed');
  });

  it('rejects invalid telegram payloads with endpoint validation rules', async () => {
    const validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    });

    await expect(
      validationPipe.transform(
        {
          update_id: 1,
          message: {
            message_id: 10,
            date: 1_742_000_000,
            chat: {
              id: 123,
              type: 'private',
            },
          },
        },
        {
          type: 'body',
          metatype: TelegramWebhookDto,
        },
      ),
    ).rejects.toBeDefined();
  });

  it('rejects invalid dev email payloads with endpoint validation rules', async () => {
    const validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    });

    await expect(
      validationPipe.transform(
        {
          fromEmail: 'invalid-email',
          toEmail: 'support@example.com',
          body: '',
        },
        {
          type: 'body',
          metatype: EmailInboundDevDto,
        },
      ),
    ).rejects.toBeDefined();
  });
});
