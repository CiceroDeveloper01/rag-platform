import { INestApplication, ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import request from 'supertest';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { TenantContextService } from '../src/common/tenancy/tenant-context.service';
import { ChatController } from '../src/modules/chat/controllers/chat.controller';
import { SessionAuthGuard } from '../src/modules/auth/guards/session-auth.guard';
import { ChatService } from '../src/modules/chat/services/chat.service';

describe('Chat API (e2e)', () => {
  let app: INestApplication;
  let httpApp: Parameters<typeof request>[0];
  let chatService: {
    chat: jest.Mock;
    streamChat: jest.Mock;
  };

  beforeEach(async () => {
    chatService = {
      chat: jest.fn().mockResolvedValue({
        queryId: 501,
        conversationId: 12,
        messageId: 87,
        answer: 'pgvector extends PostgreSQL with vector search.',
        context: [
          {
            id: 1,
            content: 'pgvector adds vector similarity search to PostgreSQL.',
            metadata: { source: 'manual.pdf' },
            distance: 0.14,
          },
        ],
      }),
      streamChat: jest.fn(async function* () {
        yield {
          event: 'context',
          data: {
            question: 'What is pgvector?',
            conversationId: 12,
            context: [
              {
                id: 1,
                content:
                  'pgvector adds vector similarity search to PostgreSQL.',
                metadata: { source: 'manual.pdf' },
                distance: 0.14,
              },
            ],
          },
        };
        yield {
          event: 'token',
          data: {
            delta: 'pgvector ',
          },
        };
        yield {
          event: 'done',
          data: {
            queryId: 501,
            conversationId: 12,
            messageId: 87,
            answer: 'pgvector extends PostgreSQL with vector search.',
          },
        };
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: chatService,
        },
        {
          provide: SessionAuthGuard,
          useValue: {
            canActivate: (context: {
              switchToHttp: () => { getRequest: () => Record<string, unknown> };
            }) => {
              const request = context.switchToHttp().getRequest();
              request.user = {
                id: 1,
                email: 'user@example.com',
                fullName: 'RAG User',
                role: 'admin',
              };
              return true;
            },
          },
        },
        {
          provide: Logger,
          useValue: {
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
        {
          provide: TenantContextService,
          useValue: {
            resolveTenant: jest.fn().mockReturnValue('default-tenant'),
          },
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => Record<string, unknown> };
        }) => {
          const request = context.switchToHttp().getRequest();
          request.user = {
            id: 1,
            email: 'user@example.com',
            fullName: 'RAG User',
            role: 'admin',
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter(moduleFixture.get(Logger)));
    await app.init();
    httpApp = app.getHttpAdapter().getInstance();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('accepts a valid chat request and returns a structured response', async () => {
    const response = await request(httpApp)
      .post('/api/v1/chat')
      .send({
        question: 'What is pgvector?',
        topK: 5,
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        queryId: 501,
        conversationId: 12,
        messageId: 87,
        answer: expect.any(String),
        context: expect.any(Array),
      }),
    );
    expect(chatService.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        question: 'What is pgvector?',
        topK: 5,
      }),
      expect.objectContaining({
        id: 1,
      }),
    );
  });

  it('streams SSE events when the client requests text/event-stream', async () => {
    const response = await request(httpApp)
      .post('/api/v1/chat')
      .set('Accept', 'text/event-stream')
      .send({
        question: 'What is pgvector?',
        stream: true,
      })
      .expect(201);

    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.text).toContain('event: context');
    expect(response.text).toContain('event: token');
    expect(response.text).toContain('event: done');
    expect(response.text).toContain(
      'pgvector extends PostgreSQL with vector search.',
    );
  });

  it('returns the standard error payload when the chat service is unavailable', async () => {
    chatService.chat.mockRejectedValueOnce(
      new ServiceUnavailableException('RAG pipeline is unavailable'),
    );

    const response = await request(httpApp)
      .post('/api/v1/chat')
      .send({
        question: 'What is pgvector?',
      })
      .expect(503);

    expect(response.body).toEqual(
      expect.objectContaining({
        code: 'SERVICE_UNAVAILABLE',
        message: 'RAG pipeline is unavailable',
        timestamp: expect.any(String),
      }),
    );
  });
});
