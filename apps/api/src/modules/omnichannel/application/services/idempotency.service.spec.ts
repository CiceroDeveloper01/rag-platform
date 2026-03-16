import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { DatabaseService } from '../../../../infra/database/database.service';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { IdempotencyService } from './idempotency.service';

describe('IdempotencyService', () => {
  const databaseService = {
    query: jest.fn(),
  };
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
  };

  let service: IdempotencyService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        IdempotencyService,
        {
          provide: DatabaseService,
          useValue: databaseService,
        },
        {
          provide: PinoLogger,
          useValue: logger,
        },
      ],
    }).compile();

    service = moduleRef.get(IdempotencyService);
  });

  it('returns true when the inbound message is already registered', async () => {
    databaseService.query.mockResolvedValue([{ exists: true }]);

    await expect(
      service.isDuplicate(MessageChannel.TELEGRAM, 'telegram-message-1'),
    ).resolves.toBe(true);
  });

  it('returns false when register hits a duplicate', async () => {
    databaseService.query.mockResolvedValue([]);

    await expect(
      service.register(MessageChannel.EMAIL, 'mail-1', { provider: 'dev' }),
    ).resolves.toBe(false);
  });
});
