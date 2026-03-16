import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { AppCacheService } from '../../../common/cache/services/app-cache.service';
import { CONVERSATIONS_REPOSITORY } from '../../conversations/interfaces/conversations-repository.interface';
import { EMBEDDING_SERVICE } from '../../../infra/ai/embeddings/embedding.interface';
import { LLM_SERVICE } from '../../../infra/ai/llm/llm.interface';
import { MetricsService } from '../../../infra/observability/metrics.service';
import { SearchService } from '../../search/services/search.service';
import { QUERY_REPOSITORY } from '../interfaces/query-repository.interface';
import { ChatService } from './chat.service';
import { DOCUMENTS_REPOSITORY } from '../../documents/interfaces/documents-repository.interface';

describe('ChatService', () => {
  const searchService = {
    searchByEmbedding: jest.fn(),
  };
  const embeddingService = {
    generateEmbedding: jest.fn(),
  };
  const llmService = {
    generateCompletion: jest.fn(),
    streamCompletion: jest.fn(),
  };
  const queryRepository = {
    create: jest.fn(),
  };
  const conversationsRepository = {
    findById: jest.fn(),
    create: jest.fn(),
    appendMessage: jest.fn(),
  };
  const documentsRepository = {
    list: jest.fn(),
  };
  const appCacheService = {
    wrap: jest.fn(async (_key: string, factory: () => Promise<unknown>) =>
      factory(),
    ),
  };
  const metricsService = {
    recordRagRequest: jest.fn(),
    observeRagEmbeddingDuration: jest.fn(),
    observeRagVectorSearchDuration: jest.fn(),
    observeRagLlmDuration: jest.fn(),
  };
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const user = {
    id: 1,
    email: 'user@example.com',
    fullName: 'RAG User',
    role: 'admin' as const,
  };

  let service: ChatService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: SearchService,
          useValue: searchService,
        },
        {
          provide: EMBEDDING_SERVICE,
          useValue: embeddingService,
        },
        {
          provide: LLM_SERVICE,
          useValue: llmService,
        },
        {
          provide: QUERY_REPOSITORY,
          useValue: queryRepository,
        },
        {
          provide: CONVERSATIONS_REPOSITORY,
          useValue: conversationsRepository,
        },
        {
          provide: DOCUMENTS_REPOSITORY,
          useValue: documentsRepository,
        },
        {
          provide: AppCacheService,
          useValue: appCacheService,
        },
        {
          provide: MetricsService,
          useValue: metricsService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: unknown) => {
              const values: Record<string, unknown> = {
                'ai.llmTimeoutMs': 2_000,
              };

              return values[key] ?? fallback;
            }),
          },
        },
        {
          provide: PinoLogger,
          useValue: logger,
        },
      ],
    }).compile();

    service = moduleRef.get(ChatService);
  });

  it('runs the chat pipeline, stores conversation messages and caches assembled context', async () => {
    conversationsRepository.create.mockResolvedValue({
      id: 10,
      title: 'What is pgvector?',
    });
    conversationsRepository.appendMessage
      .mockResolvedValueOnce({
        id: 100,
        role: 'user',
        content: 'What is pgvector?',
      })
      .mockResolvedValueOnce({
        id: 101,
        role: 'assistant',
        content: 'pgvector enables similarity search.',
      });
    embeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
    searchService.searchByEmbedding.mockResolvedValue([
      {
        id: 1,
        content: 'pgvector extends PostgreSQL with vector similarity search.',
        metadata: { source: 'manual.pdf' },
        distance: 0.11,
      },
      {
        id: 2,
        content:
          'It is often used in retrieval-augmented generation pipelines.',
        metadata: { source: 'guide.md' },
        distance: 0.19,
      },
    ]);
    llmService.generateCompletion.mockResolvedValue(
      'pgvector enables similarity search.',
    );
    queryRepository.create.mockResolvedValue({ id: 501 });

    const result = await service.chat(
      {
        question: 'What is pgvector?',
        topK: 5,
      },
      user,
    );

    expect(appCacheService.wrap).toHaveBeenCalledWith(
      expect.stringMatching(/^rag:context:/),
      expect.any(Function),
      expect.objectContaining({ ttl: 30 }),
    );
    expect(embeddingService.generateEmbedding).toHaveBeenCalledWith(
      'What is pgvector?',
    );
    expect(searchService.searchByEmbedding).toHaveBeenCalledWith(
      [0.1, 0.2, 0.3],
      5,
      'default-tenant',
    );
    expect(llmService.generateCompletion).toHaveBeenCalledWith(
      expect.stringContaining('Question:\nWhat is pgvector?'),
      expect.objectContaining({ stream: undefined }),
    );
    expect(conversationsRepository.create).toHaveBeenCalledWith({
      userId: 1,
      title: 'What is pgvector?',
    });
    expect(conversationsRepository.appendMessage).toHaveBeenNthCalledWith(1, {
      conversationId: 10,
      role: 'user',
      content: 'What is pgvector?',
    });
    expect(conversationsRepository.appendMessage).toHaveBeenNthCalledWith(2, {
      conversationId: 10,
      role: 'assistant',
      content: 'pgvector enables similarity search.',
    });
    expect(result).toEqual(
      expect.objectContaining({
        queryId: 501,
        conversationId: 10,
        messageId: 101,
        answer: 'pgvector enables similarity search.',
        context: expect.arrayContaining([
          expect.objectContaining({ id: 1 }),
          expect.objectContaining({ id: 2 }),
        ]),
      }),
    );
    expect(metricsService.recordRagRequest).toHaveBeenCalledWith(
      '/chat',
      'success',
    );
  });

  it('reuses an existing conversation when a valid conversationId is provided', async () => {
    conversationsRepository.findById.mockResolvedValue({
      id: 77,
      title: 'Existing conversation',
    });
    conversationsRepository.appendMessage
      .mockResolvedValueOnce({
        id: 201,
        role: 'user',
        content: 'Reuse the thread',
      })
      .mockResolvedValueOnce({
        id: 202,
        role: 'assistant',
        content: 'Thread reused successfully.',
      });
    embeddingService.generateEmbedding.mockResolvedValue([0.4, 0.5]);
    searchService.searchByEmbedding.mockResolvedValue([
      {
        id: 9,
        content: 'Thread context',
        metadata: null,
        distance: 0.12,
      },
    ]);
    llmService.generateCompletion.mockResolvedValue(
      'Thread reused successfully.',
    );
    queryRepository.create.mockResolvedValue({ id: 601 });

    const result = await service.chat(
      {
        conversationId: 77,
        question: 'Reuse the thread',
      },
      user,
    );

    expect(conversationsRepository.findById).toHaveBeenCalledWith(77, 1);
    expect(conversationsRepository.create).not.toHaveBeenCalled();
    expect(result.conversationId).toBe(77);
  });

  it('streams context, token chunks and completion metadata', async () => {
    conversationsRepository.create.mockResolvedValue({
      id: 55,
      title: 'Streaming question',
    });
    conversationsRepository.appendMessage
      .mockResolvedValueOnce({
        id: 301,
        role: 'user',
        content: 'Stream this answer',
      })
      .mockResolvedValueOnce({
        id: 302,
        role: 'assistant',
        content: 'Hello world',
      });
    embeddingService.generateEmbedding.mockResolvedValue([0.8]);
    searchService.searchByEmbedding.mockResolvedValue([
      {
        id: 3,
        content: 'Streaming context',
        metadata: null,
        distance: 0.2,
      },
    ]);
    llmService.streamCompletion.mockImplementation(async function* () {
      yield 'Hello ';
      yield 'world';
    });
    queryRepository.create.mockResolvedValue({ id: 701 });

    const events = [];

    for await (const event of service.streamChat(
      { question: 'Stream this answer' },
      user,
    )) {
      events.push(event);
    }

    expect(events).toEqual([
      expect.objectContaining({
        event: 'context',
        data: expect.objectContaining({
          conversationId: 55,
          context: [expect.objectContaining({ id: 3 })],
        }),
      }),
      {
        event: 'token',
        data: { delta: 'Hello ' },
      },
      {
        event: 'token',
        data: { delta: 'world' },
      },
      expect.objectContaining({
        event: 'done',
        data: expect.objectContaining({
          queryId: 701,
          conversationId: 55,
          messageId: 302,
          answer: 'Hello world',
        }),
      }),
    ]);
    expect(metricsService.recordRagRequest).toHaveBeenCalledWith(
      '/chat',
      'success',
    );
  });

  it('wraps pipeline failures in a service unavailable exception', async () => {
    conversationsRepository.create.mockResolvedValue({
      id: 90,
      title: 'Broken pipeline',
    });
    conversationsRepository.appendMessage.mockResolvedValue({
      id: 401,
      role: 'user',
      content: 'Will this fail?',
    });
    embeddingService.generateEmbedding.mockRejectedValue(
      new Error('embedding provider exploded'),
    );

    await expect(
      service.chat(
        {
          question: 'Will this fail?',
        },
        user,
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(metricsService.recordRagRequest).toHaveBeenCalledWith(
      '/chat',
      'error',
    );
    expect(logger.error).toHaveBeenCalled();
  });

  it('falls back to keyword retrieval and contextual answer when OpenAI services are unavailable', async () => {
    conversationsRepository.create.mockResolvedValue({
      id: 91,
      title: 'Fallback pipeline',
    });
    conversationsRepository.appendMessage
      .mockResolvedValueOnce({
        id: 501,
        role: 'user',
        content: 'Algum documento fala sobre fatura?',
      })
      .mockResolvedValueOnce({
        id: 502,
        role: 'assistant',
        content: 'fallback answer',
      });
    embeddingService.generateEmbedding.mockRejectedValue(
      new ServiceUnavailableException('OPENAI_API_KEY is not configured'),
    );
    documentsRepository.list.mockResolvedValue([
      {
        id: 7,
        sourceId: 2,
        content:
          'A fatura deve ser paga em ate 10 dias apos a emissao do documento.',
        metadata: { source: 'financeiro.pdf' },
        createdAt: new Date(),
      },
    ]);
    llmService.generateCompletion.mockRejectedValue(
      new ServiceUnavailableException('OPENAI_API_KEY is not configured'),
    );
    queryRepository.create.mockResolvedValue({ id: 801 });

    const result = await service.chat(
      {
        question: 'Algum documento fala sobre fatura?',
      },
      user,
    );

    expect(documentsRepository.list).toHaveBeenCalled();
    expect(result.answer).toContain('Nao consegui usar o modelo de linguagem');
    expect(result.answer).toContain('fatura');
    expect(result.context).toEqual([expect.objectContaining({ id: 7 })]);
    expect(metricsService.recordRagRequest).toHaveBeenCalledWith(
      '/chat',
      'success',
    );
  });

  it('returns a clear no-context answer without calling the LLM when retrieval finds nothing', async () => {
    conversationsRepository.create.mockResolvedValue({
      id: 93,
      title: 'No context',
    });
    conversationsRepository.appendMessage
      .mockResolvedValueOnce({
        id: 701,
        role: 'user',
        content: 'Tem algo sobre contrato social?',
      })
      .mockResolvedValueOnce({
        id: 702,
        role: 'assistant',
        content: 'no context answer',
      });
    embeddingService.generateEmbedding.mockResolvedValue([0.9, 0.1]);
    searchService.searchByEmbedding.mockResolvedValue([]);
    queryRepository.create.mockResolvedValue({ id: 1001 });

    const result = await service.chat(
      {
        question: 'Tem algo sobre contrato social?',
      },
      user,
    );

    expect(llmService.generateCompletion).not.toHaveBeenCalled();
    expect(result.context).toEqual([]);
    expect(result.answer).toContain('Nao encontrei contexto relevante');
    expect(result.answer).toContain('contrato social');
  });

  it('streams a retrieval-only fallback answer when the LLM is unavailable', async () => {
    conversationsRepository.create.mockResolvedValue({
      id: 92,
      title: 'Streaming fallback',
    });
    conversationsRepository.appendMessage
      .mockResolvedValueOnce({
        id: 601,
        role: 'user',
        content: 'Existe algo sobre SLA?',
      })
      .mockResolvedValueOnce({
        id: 602,
        role: 'assistant',
        content: 'fallback',
      });
    embeddingService.generateEmbedding.mockRejectedValue(
      new ServiceUnavailableException('OPENAI_API_KEY is not configured'),
    );
    documentsRepository.list.mockResolvedValue([
      {
        id: 8,
        sourceId: 3,
        content:
          'O SLA padrao define prazo maximo de resposta de 24 horas para incidentes criticos.',
        metadata: { source: 'ops.md' },
        createdAt: new Date(),
      },
    ]);
    llmService.streamCompletion.mockImplementation(() => {
      throw new ServiceUnavailableException('OPENAI_API_KEY is not configured');
    });
    queryRepository.create.mockResolvedValue({ id: 901 });

    const events = [];

    for await (const event of service.streamChat(
      { question: 'Existe algo sobre SLA?' },
      user,
    )) {
      events.push(event);
    }

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ event: 'context' }),
        expect.objectContaining({
          event: 'token',
          data: expect.objectContaining({
            delta: expect.stringContaining('Nao consegui usar o modelo'),
          }),
        }),
        expect.objectContaining({
          event: 'done',
          data: expect.objectContaining({
            answer: expect.stringContaining('SLA'),
          }),
        }),
      ]),
    );
  });

  it('streams an immediate no-context answer when retrieval returns no matching documents', async () => {
    conversationsRepository.create.mockResolvedValue({
      id: 94,
      title: 'Streaming no context',
    });
    conversationsRepository.appendMessage
      .mockResolvedValueOnce({
        id: 801,
        role: 'user',
        content: 'Existe algo sobre auditoria externa?',
      })
      .mockResolvedValueOnce({
        id: 802,
        role: 'assistant',
        content: 'no context answer',
      });
    embeddingService.generateEmbedding.mockResolvedValue([0.7, 0.3]);
    searchService.searchByEmbedding.mockResolvedValue([]);
    queryRepository.create.mockResolvedValue({ id: 1101 });

    const events = [];

    for await (const event of service.streamChat(
      { question: 'Existe algo sobre auditoria externa?' },
      user,
    )) {
      events.push(event);
    }

    expect(llmService.streamCompletion).not.toHaveBeenCalled();
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'context',
          data: expect.objectContaining({ context: [] }),
        }),
        expect.objectContaining({
          event: 'token',
          data: expect.objectContaining({
            delta: expect.stringContaining('Nao encontrei contexto relevante'),
          }),
        }),
        expect.objectContaining({
          event: 'done',
          data: expect.objectContaining({
            answer: expect.stringContaining('auditoria externa'),
          }),
        }),
      ]),
    );
  });
});
