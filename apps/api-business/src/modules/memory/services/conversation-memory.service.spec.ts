import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { ConversationMemoryService } from './conversation-memory.service';
import { CONVERSATION_MEMORY_REPOSITORY } from '../interfaces/conversation-memory-repository.interface';

describe('Api ConversationMemoryService', () => {
  const repository = {
    store: jest.fn(),
    findRecent: jest.fn(),
    findSimilar: jest.fn(),
    trimConversation: jest.fn(),
    purgeExpired: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string, defaultValue?: number) => {
      const values: Record<string, number> = {
        'memory.retentionDays': 30,
        'memory.maxMessageChars': 12,
        'memory.maxMessagesPerConversation': 2,
        'memory.recentLimit': 8,
        'memory.semanticLimit': 5,
      };
      return values[key] ?? defaultValue;
    }),
  } as unknown as ConfigService;

  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  } as unknown as PinoLogger;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores conversation memory with truncation and retention', async () => {
    repository.store.mockResolvedValue({
      id: 1,
      tenantId: 'tenant-a',
      channel: 'telegram',
      conversationId: 'conv-1',
      role: 'user',
      message: '012345678901',
      metadata: null,
      createdAt: new Date('2026-03-15T10:00:00.000Z'),
      expiresAt: new Date('2026-04-14T10:00:00.000Z'),
    });
    repository.trimConversation.mockResolvedValue(undefined);
    repository.purgeExpired.mockResolvedValue(0);

    const service = new ConversationMemoryService(
      repository as unknown as typeof CONVERSATION_MEMORY_REPOSITORY,
      configService,
      logger,
    );

    const result = await service.storeMessage({
      tenantId: 'tenant-a',
      channel: 'telegram',
      conversationId: 'conv-1',
      role: 'user',
      message: '0123456789012345',
      embedding: [0.1, 0.2],
    });

    expect(repository.store).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '012345678901',
      }),
    );
    expect(repository.trimConversation).toHaveBeenCalledWith(
      'tenant-a',
      'telegram',
      'conv-1',
      2,
    );
    expect(result.id).toBe(1);
  });

  it('queries recent and semantic memory using configured defaults', async () => {
    repository.findRecent.mockResolvedValue([]);
    repository.findSimilar.mockResolvedValue([]);

    const service = new ConversationMemoryService(
      repository as unknown as typeof CONVERSATION_MEMORY_REPOSITORY,
      configService,
      logger,
    );

    await service.queryContext({
      tenantId: 'tenant-a',
      channel: 'telegram',
      conversationId: 'conv-1',
      queryEmbedding: [0.1, 0.2],
    });

    expect(repository.findRecent).toHaveBeenCalledWith(
      expect.objectContaining({
        recentLimit: 8,
      }),
    );
    expect(repository.findSimilar).toHaveBeenCalledWith(
      expect.objectContaining({
        semanticLimit: 5,
      }),
    );
  });
});
