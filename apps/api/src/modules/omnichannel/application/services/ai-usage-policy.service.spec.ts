import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AppCacheService } from '../../../../common/cache/services/app-cache.service';
import { MetricsService } from '../../../../infra/observability/metrics.service';
import { OmnichannelMessage } from '../../domain/entities/omnichannel-message.entity';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { AiUsagePolicyService } from './ai-usage-policy.service';

describe('AiUsagePolicyService', () => {
  const cache = new Map<string, unknown>();
  const appCacheService = {
    get: jest.fn(async (key: string) =>
      cache.has(key) ? cache.get(key) : null,
    ),
    set: jest.fn(async (key: string, value: unknown) => {
      cache.set(key, value);
    }),
  };
  const metricsService = {
    incrementCustomCounter: jest.fn(),
  };

  let service: AiUsagePolicyService;

  beforeEach(async () => {
    cache.clear();
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AiUsagePolicyService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: unknown) => {
              const values: Record<string, unknown> = {
                'ai.maxPromptTokens': 120,
                'ai.maxCompletionTokens': 256,
                'ai.maxMessageCharacters': 120,
                'ai.maxRequestsPerMinute': 10,
              };

              return values[key] ?? fallback;
            }),
          },
        },
        {
          provide: AppCacheService,
          useValue: appCacheService,
        },
        {
          provide: MetricsService,
          useValue: metricsService,
        },
      ],
    }).compile();

    service = moduleRef.get(AiUsagePolicyService);
  });

  it('accepts a valid request and returns token limits', async () => {
    const result = await service.evaluate(
      OmnichannelMessage.createInbound({
        channel: MessageChannel.EMAIL,
        body: 'Need the latest privacy policy summary',
        normalizedText: 'Need the latest privacy policy summary',
        senderId: 'user-1',
      }),
      {
        question: 'privacy policy',
        contexts: [
          { id: 1, content: 'Policy context', metadata: null, distance: 0.12 },
        ],
      },
    );

    expect(result.allow).toBe(true);
    expect(result.maxPromptTokens).toBe(120);
    expect(result.maxCompletionTokens).toBe(256);
    expect(result.estimatedPromptTokens).toBeGreaterThan(0);
    expect(appCacheService.set).toHaveBeenCalled();
    expect(metricsService.incrementCustomCounter).toHaveBeenCalledWith(
      'ai_requests_total',
      {
        channel: MessageChannel.EMAIL,
      },
    );
  });

  it('blocks oversized messages', async () => {
    const result = await service.evaluate(
      OmnichannelMessage.createInbound({
        channel: MessageChannel.TELEGRAM,
        body: 'x'.repeat(121),
        normalizedText: 'x'.repeat(121),
      }),
    );

    expect(result.allow).toBe(false);
    expect(result.reason).toBe('MESSAGE_TOO_LONG');
    expect(metricsService.incrementCustomCounter).toHaveBeenCalledWith(
      'ai_policy_rejections_total',
      { channel: MessageChannel.TELEGRAM, reason: 'MESSAGE_TOO_LONG' },
    );
  });

  it('blocks prompts that exceed the token budget after RAG context is added', async () => {
    const result = await service.evaluate(
      OmnichannelMessage.createInbound({
        channel: MessageChannel.EMAIL,
        body: 'Short question',
        normalizedText: 'Short question',
        senderId: 'user-2',
      }),
      {
        question: 'Short question',
        contexts: [
          {
            id: 1,
            content: 'Y'.repeat(800),
            metadata: null,
            distance: 0.1,
          },
        ],
      },
    );

    expect(result.allow).toBe(false);
    expect(result.reason).toBe('TOKEN_LIMIT_EXCEEDED');
  });

  it('blocks requests that exceed the per-user and per-channel rate limit window', async () => {
    const message = OmnichannelMessage.createInbound({
      channel: MessageChannel.SLACK,
      body: 'hello',
      normalizedText: 'hello',
      senderId: 'rate-limited-user',
    });

    for (let index = 0; index < 10; index += 1) {
      await service.evaluate(message);
    }

    const result = await service.evaluate(message);
    expect(result.allow).toBe(false);
    expect(result.reason).toBe('RATE_LIMIT_EXCEEDED');
    expect(metricsService.incrementCustomCounter).toHaveBeenCalledWith(
      'ai_requests_blocked_total',
      { channel: MessageChannel.SLACK, reason: 'RATE_LIMIT_EXCEEDED' },
    );
  });
});
