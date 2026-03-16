import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { OmnichannelExecution } from '../../domain/entities/omnichannel-execution.entity';
import { OmnichannelMessage } from '../../domain/entities/omnichannel-message.entity';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { OMNICHANNEL_MESSAGE_REPOSITORY } from '../../domain/repositories/message-repository.interface';
import { OMNICHANNEL_EXECUTION_REPOSITORY } from '../../domain/repositories/execution-repository.interface';
import { OMNICHANNEL_METRIC_SNAPSHOT_REPOSITORY } from '../../domain/repositories/metric-snapshot-repository.interface';
import { OMNICHANNEL_MESSAGE_NORMALIZER } from '../interfaces/message-normalizer.interface';
import { OMNICHANNEL_AGENT_EXECUTOR } from '../interfaces/agent-executor.interface';
import { OMNICHANNEL_RAG_GATEWAY } from '../interfaces/rag-gateway.interface';
import { OMNICHANNEL_OUTBOUND_DISPATCHER } from '../interfaces/outbound-dispatcher.interface';
import { OMNICHANNEL_TRACE_SERVICE } from '../interfaces/trace-service.interface';
import { OMNICHANNEL_CORRELATION_SERVICE } from '../interfaces/correlation-service.interface';
import { OMNICHANNEL_METRICS_SERVICE } from '../interfaces/metrics-service.interface';
import { OMNICHANNEL_CLOCK_SERVICE } from '../interfaces/clock-service.interface';
import { FeatureFlagsService } from '../../../../common/feature-flags/feature-flags.service';
import { AiUsagePolicyService } from './ai-usage-policy.service';
import { ExecutionService } from './execution.service';
import { OmnichannelRuntimePolicyService } from './omnichannel-runtime-policy.service';
import { RagUsagePolicyService } from './rag-usage-policy.service';
import { OmnichannelOrchestratorService } from './omnichannel-orchestrator.service';

describe('OmnichannelOrchestratorService', () => {
  const messageRepository = {
    create: jest.fn(),
    updateStatus: jest.fn(),
  };
  const executionRepository = {
    create: jest.fn(),
    finishSuccess: jest.fn(),
    finishFailure: jest.fn(),
  };
  const metricSnapshotRepository = {
    refreshDailySnapshot: jest.fn(),
  };
  const messageNormalizer = {
    normalize: jest.fn((payload) => payload),
  };
  const agentExecutor = {
    execute: jest.fn(),
  };
  const ragGateway = {
    query: jest.fn(),
  };
  const outboundDispatcher = {
    dispatch: jest.fn().mockResolvedValue({ accepted: false }),
  };
  const traceService = {
    startSpan: jest.fn().mockReturnValue({
      traceId: 'trace-1',
      spanId: 'span-1',
      end: jest.fn(),
    }),
    getCurrentTraceId: jest.fn().mockReturnValue('trace-1'),
    runInChildSpan: jest.fn(
      async (
        _traceId: string,
        _name: string,
        operation: () => Promise<unknown>,
      ) => operation(),
    ),
  };
  const correlationService = {
    create: jest.fn().mockReturnValue('corr-1'),
  };
  const metricsService = {
    recordRequest: jest.fn(),
    observeLatency: jest.fn(),
    recordRagUsage: jest.fn(),
    recordFailure: jest.fn(),
  };
  const clockService = {
    now: jest.fn(),
  };
  const ragUsagePolicyService = {
    evaluate: jest.fn(),
  };
  const aiUsagePolicyService = {
    evaluate: jest.fn(),
    recordExecution: jest.fn(),
  };
  const executionService = {
    createExecution: jest.fn().mockResolvedValue({ id: 909 }),
    logEvent: jest.fn().mockResolvedValue(undefined),
    completeExecution: jest.fn().mockResolvedValue(undefined),
    failExecution: jest.fn().mockResolvedValue(undefined),
  };
  const featureFlagsService = {
    isRagEnabled: jest.fn().mockReturnValue(true),
    isAiUsagePolicyEnabled: jest.fn().mockReturnValue(true),
    recordDisabledHit: jest.fn(),
  };
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  let service: OmnichannelOrchestratorService;

  beforeEach(async () => {
    jest.clearAllMocks();
    featureFlagsService.isRagEnabled.mockReturnValue(true);
    featureFlagsService.isAiUsagePolicyEnabled.mockReturnValue(true);
    clockService.now
      .mockReturnValueOnce(new Date('2026-03-13T10:00:00.000Z'))
      .mockReturnValueOnce(new Date('2026-03-13T10:00:01.500Z'))
      .mockReturnValueOnce(new Date('2026-03-13T10:00:00.000Z'))
      .mockReturnValueOnce(new Date('2026-03-13T10:00:02.000Z'));

    messageRepository.create.mockImplementation(
      async (message: OmnichannelMessage) => {
        const source = message.toObject();

        return new OmnichannelMessage({
          ...source,
          id: source.direction === 'INBOUND' ? 101 : 202,
        });
      },
    );
    executionRepository.create.mockImplementation(
      async (execution: OmnichannelExecution) => {
        const source = execution.toObject();

        return new OmnichannelExecution({
          ...source,
          id: 303,
        });
      },
    );
    executionRepository.finishSuccess.mockImplementation(
      async (execution: OmnichannelExecution) => execution,
    );
    executionRepository.finishFailure.mockImplementation(
      async (execution: OmnichannelExecution) => execution,
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        OmnichannelOrchestratorService,
        {
          provide: OMNICHANNEL_MESSAGE_REPOSITORY,
          useValue: messageRepository,
        },
        {
          provide: OMNICHANNEL_EXECUTION_REPOSITORY,
          useValue: executionRepository,
        },
        {
          provide: OMNICHANNEL_METRIC_SNAPSHOT_REPOSITORY,
          useValue: metricSnapshotRepository,
        },
        {
          provide: OMNICHANNEL_MESSAGE_NORMALIZER,
          useValue: messageNormalizer,
        },
        {
          provide: OMNICHANNEL_AGENT_EXECUTOR,
          useValue: agentExecutor,
        },
        {
          provide: OMNICHANNEL_RAG_GATEWAY,
          useValue: ragGateway,
        },
        {
          provide: OMNICHANNEL_OUTBOUND_DISPATCHER,
          useValue: outboundDispatcher,
        },
        {
          provide: OMNICHANNEL_TRACE_SERVICE,
          useValue: traceService,
        },
        {
          provide: OMNICHANNEL_CORRELATION_SERVICE,
          useValue: correlationService,
        },
        {
          provide: OMNICHANNEL_METRICS_SERVICE,
          useValue: metricsService,
        },
        {
          provide: OMNICHANNEL_CLOCK_SERVICE,
          useValue: clockService,
        },
        {
          provide: RagUsagePolicyService,
          useValue: ragUsagePolicyService,
        },
        {
          provide: AiUsagePolicyService,
          useValue: aiUsagePolicyService,
        },
        {
          provide: ExecutionService,
          useValue: executionService,
        },
        {
          provide: OmnichannelRuntimePolicyService,
          useValue: {
            assertApiRuntimeEnabled: jest.fn(),
          },
        },
        {
          provide: FeatureFlagsService,
          useValue: featureFlagsService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: unknown) => {
              const values: Record<string, unknown> = {
                'omnichannel.enabled': true,
                'omnichannel.defaultAgent': 'rag-agent',
                'omnichannel.autoResponse': true,
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

    service = moduleRef.get(OmnichannelOrchestratorService);
  });

  it('falls back to direct agent execution when the RAG feature flag is disabled', async () => {
    featureFlagsService.isRagEnabled.mockReturnValue(false);
    ragUsagePolicyService.evaluate.mockReturnValue({
      useRag: true,
      matchedKeywords: ['manual'],
      reason: 'keyword_match',
    });
    aiUsagePolicyService.evaluate.mockResolvedValue({
      allow: true,
      estimatedPromptTokens: 5,
      maxPromptTokens: 4000,
      maxCompletionTokens: 1000,
      rateLimitKey: 'ai:rate-limit:EMAIL:user-1',
    });
    agentExecutor.execute.mockResolvedValue({
      responseText: 'Resposta direta sem RAG',
      modelName: 'gpt-4o-mini',
      inputTokens: 8,
      outputTokens: 6,
      usedRag: false,
      ragQuery: null,
    });

    const result = await service.process({
      channel: MessageChannel.EMAIL,
      body: 'Preciso do manual',
    });

    expect(result.usedRag).toBe(false);
    expect(ragGateway.query).not.toHaveBeenCalled();
    expect(featureFlagsService.recordDisabledHit).toHaveBeenCalledWith(
      'rag',
      expect.any(Object),
    );
  });

  it('processes a message with RAG context', async () => {
    ragUsagePolicyService.evaluate.mockReturnValue({
      useRag: true,
      matchedKeywords: ['manual'],
      reason: 'keyword_match',
    });
    aiUsagePolicyService.evaluate.mockResolvedValue({
      allow: true,
      estimatedPromptTokens: 20,
      maxPromptTokens: 4000,
      maxCompletionTokens: 800,
      rateLimitKey: 'ai:rate-limit:EMAIL:user-1',
    });
    ragGateway.query.mockResolvedValue({
      question: 'manual',
      contexts: [
        { id: 1, content: 'Manual chunk', metadata: null, distance: 0.1 },
      ],
    });
    agentExecutor.execute.mockResolvedValue({
      responseText: 'Resposta com contexto',
      modelName: 'gpt-4o-mini',
      inputTokens: 20,
      outputTokens: 15,
      usedRag: true,
      ragQuery: 'manual',
    });

    const result = await service.process({
      channel: MessageChannel.EMAIL,
      body: 'Preciso do manual',
    });

    expect(result.usedRag).toBe(true);
    expect(ragGateway.query).toHaveBeenCalledTimes(1);
    expect(metricsService.recordRagUsage).toHaveBeenCalledWith(
      MessageChannel.EMAIL,
    );
    expect(aiUsagePolicyService.evaluate).toHaveBeenCalled();
    expect(aiUsagePolicyService.recordExecution).toHaveBeenCalledWith(
      expect.any(OmnichannelMessage),
      20,
      15,
    );
    expect(executionService.createExecution).toHaveBeenCalled();
    expect(executionService.logEvent).toHaveBeenCalled();
    expect(executionService.completeExecution).toHaveBeenCalled();
  });

  it('processes a message without RAG when policy disables it', async () => {
    ragUsagePolicyService.evaluate.mockReturnValue({
      useRag: false,
      matchedKeywords: [],
      reason: 'direct_response',
    });
    aiUsagePolicyService.evaluate.mockResolvedValue({
      allow: true,
      estimatedPromptTokens: 5,
      maxPromptTokens: 4000,
      maxCompletionTokens: 800,
      rateLimitKey: 'ai:rate-limit:SLACK:user-1',
    });
    agentExecutor.execute.mockResolvedValue({
      responseText: 'Resposta direta',
      modelName: 'gpt-4o-mini',
      inputTokens: 10,
      outputTokens: 8,
      usedRag: false,
      ragQuery: null,
    });

    const result = await service.process({
      channel: MessageChannel.SLACK,
      body: 'Oi',
    });

    expect(result.usedRag).toBe(false);
    expect(ragGateway.query).not.toHaveBeenCalled();
  });

  it('fails when the agent executor throws', async () => {
    ragUsagePolicyService.evaluate.mockReturnValue({
      useRag: false,
      matchedKeywords: [],
      reason: 'direct_response',
    });
    aiUsagePolicyService.evaluate.mockResolvedValue({
      allow: true,
      estimatedPromptTokens: 5,
      maxPromptTokens: 4000,
      maxCompletionTokens: 800,
      rateLimitKey: 'ai:rate-limit:TEAMS:user-1',
    });
    agentExecutor.execute.mockRejectedValue(new Error('agent failed'));

    await expect(
      service.process({
        channel: MessageChannel.TEAMS,
        body: 'Falhar',
      }),
    ).rejects.toThrow('Omnichannel orchestrator failed');

    expect(executionRepository.finishFailure).toHaveBeenCalled();
    expect(metricsService.recordFailure).toHaveBeenCalledWith(
      MessageChannel.TEAMS,
    );
    expect(executionService.failExecution).toHaveBeenCalled();
  });

  it('fails when the rag gateway throws', async () => {
    ragUsagePolicyService.evaluate.mockReturnValue({
      useRag: true,
      matchedKeywords: ['knowledge base'],
      reason: 'keyword_match',
    });
    aiUsagePolicyService.evaluate.mockResolvedValue({
      allow: true,
      estimatedPromptTokens: 10,
      maxPromptTokens: 4000,
      maxCompletionTokens: 800,
      rateLimitKey: 'ai:rate-limit:WHATSAPP:user-1',
    });
    ragGateway.query.mockRejectedValue(new Error('rag failed'));

    await expect(
      service.process({
        channel: MessageChannel.WHATSAPP,
        body: 'Consultar knowledge base',
      }),
    ).rejects.toThrow('Omnichannel orchestrator failed');

    expect(executionRepository.finishFailure).toHaveBeenCalled();
    expect(metricsService.recordFailure).toHaveBeenCalledWith(
      MessageChannel.WHATSAPP,
    );
    expect(executionService.failExecution).toHaveBeenCalled();
  });

  it('returns a safe response when the AI usage policy rejects the request', async () => {
    ragUsagePolicyService.evaluate.mockReturnValue({
      useRag: false,
      matchedKeywords: [],
      reason: 'direct_response',
    });
    aiUsagePolicyService.evaluate.mockResolvedValue({
      allow: false,
      reason: 'RATE_LIMIT_EXCEEDED',
      estimatedPromptTokens: 5,
      maxPromptTokens: 4000,
      maxCompletionTokens: 1000,
      rateLimitKey: 'ai:rate-limit:EMAIL:user-1',
    });
    outboundDispatcher.dispatch.mockResolvedValue({ accepted: false });

    const result = await service.process({
      channel: MessageChannel.EMAIL,
      body: 'Need help',
    });

    expect(agentExecutor.execute).not.toHaveBeenCalled();
    expect(result.responseText).toContain('rate limit');
    expect(executionService.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'ai_policy_rejected',
      }),
    );
    expect(executionService.completeExecution).toHaveBeenCalled();
  });
});
