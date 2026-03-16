import { Channel } from "@rag-platform/contracts";
import {
  EMAIL_RECEIVED_JOB,
  INBOUND_MESSAGES_QUEUE,
  TELEGRAM_RECEIVED_JOB,
} from "../queue/queue.constants";
import { InboundMessageProcessor } from "./inbound-message.processor";

const workerState: {
  handler?: (job: any) => Promise<void>;
  events: Record<string, (job: any, error?: Error) => void>;
  close: jest.Mock<Promise<void>, []>;
  queueName?: string;
  options?: Record<string, unknown>;
} = {
  events: {},
  close: jest.fn().mockResolvedValue(undefined),
};

jest.mock("bullmq", () => ({
  Worker: jest.fn().mockImplementation((queueName, handler, options) => {
    workerState.queueName = queueName;
    workerState.handler = handler;
    workerState.options = options;

    return {
      on: jest.fn(
        (event: string, callback: (job: any, error?: Error) => void) => {
          workerState.events[event] = callback;
        },
      ),
      close: workerState.close,
    };
  }),
}));

describe("InboundMessageProcessor", () => {
  const logger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const metricsService = {
    increment: jest.fn(),
    record: jest.fn(),
  };
  const agentTracePublisherService = {
    publish: jest.fn().mockResolvedValue(undefined),
  };
  const analyticsPublisherService = {
    publish: jest.fn().mockResolvedValue(undefined),
  };
  const tenantContextMiddleware = {
    attach: jest.fn().mockReturnValue({ tenantId: "tenant-a" }),
  };
  const tokenCounterService = {
    countInputTokens: jest.fn().mockReturnValue(20),
    countOutputTokens: jest.fn().mockReturnValue(8),
  };
  const costCalculatorService = {
    calculateCost: jest.fn().mockReturnValue(0.02),
  };
  const usageRepository = {
    save: jest.fn(),
    summarizeByAgent: jest
      .fn()
      .mockReturnValue([{ agent: "conversation-agent" }]),
    summarizeByTenant: jest.fn().mockReturnValue([{ tenantId: "tenant-a" }]),
  };
  const responseEvaluatorService = {
    evaluateResponse: jest.fn().mockReturnValue({
      relevanceScore: 0.9,
      coherenceScore: 0.92,
      safetyScore: 0.99,
    }),
  };
  const evaluationRepository = {
    saveEvaluation: jest.fn(),
  };
  const evaluationMetrics = {
    getAgentQuality: jest.fn().mockReturnValue({
      averageQualityScore: 0.93,
      failureRate: 0.01,
    }),
  };
  const promptInjectionGuard = {
    assertSafe: jest.fn(),
  };
  const policyEngineService = {
    assertAuthorized: jest.fn(),
  };
  const actionValidatorService = {
    assertValid: jest.fn(),
  };
  const outputFilterService = {
    assertSafe: jest.fn(),
  };
  const agentGraphService = {
    execute: jest.fn().mockResolvedValue({
      decision: {
        intent: "reply-conversation",
        confidence: 0.95,
        targetAgent: "conversation-agent",
        detectedLanguage: "en",
      },
      executionRequest: {
        jobName: "execute.reply-conversation",
        payload: {
          channel: Channel.TELEGRAM,
          externalMessageId: "telegram:1",
          context: {
            body: "hello",
            llmContext: "We found your invoice in the portal.",
            retrievedDocuments: [
              { source: "policy.pdf", content: "Invoices are in the portal." },
            ],
            metadata: {
              tenantId: "tenant-a",
              telegramChatId: "1001",
            },
          },
        },
      },
      durationMs: 12,
    }),
  };
  const flowExecutionQueueService = {
    enqueue: jest.fn().mockResolvedValue(undefined),
  };
  const deadLetterQueueService = {
    enqueueInboundFailure: jest.fn().mockResolvedValue(undefined),
  };
  const configService = {
    get: jest.fn((key: string, fallback?: unknown) => {
      const values: Record<string, unknown> = {
        "queue.inbound.name": INBOUND_MESSAGES_QUEUE,
        "queue.inbound.concurrency": 3,
        "queue.inbound.attempts": 3,
        "features.evaluationEnabled": true,
      };
      return values[key] ?? fallback;
    }),
  };

  function createProcessor() {
    return new InboundMessageProcessor(
      configService as any,
      logger as any,
      metricsService as any,
      agentTracePublisherService as any,
      analyticsPublisherService as any,
      tenantContextMiddleware as any,
      tokenCounterService as any,
      costCalculatorService as any,
      usageRepository as any,
      responseEvaluatorService as any,
      evaluationRepository as any,
      evaluationMetrics as any,
      promptInjectionGuard as any,
      policyEngineService as any,
      actionValidatorService as any,
      outputFilterService as any,
      agentGraphService as any,
      flowExecutionQueueService as any,
      deadLetterQueueService as any,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    workerState.events = {};
    workerState.handler = undefined;
  });

  it("configures the worker and processes a Telegram job through the runtime path", async () => {
    const processor = createProcessor();
    processor.onModuleInit();

    expect(workerState.queueName).toBe(INBOUND_MESSAGES_QUEUE);
    expect(workerState.options).toEqual(
      expect.objectContaining({
        concurrency: 3,
      }),
    );

    await workerState.handler?.({
      id: "job-1",
      name: TELEGRAM_RECEIVED_JOB,
      data: {
        eventType: "message.received",
        channel: Channel.TELEGRAM,
        externalMessageId: "telegram:1",
        conversationId: "1001",
        from: "ada",
        body: "hello",
        receivedAt: "2026-03-15T12:00:00.000Z",
        metadata: {
          telegramChatId: "1001",
        },
      },
      attemptsMade: 1,
      opts: {
        attempts: 3,
      },
    });

    expect(agentGraphService.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          tenantId: "tenant-a",
          telegramChatId: "1001",
        }),
      }),
    );
    expect(responseEvaluatorService.evaluateResponse).toHaveBeenCalled();
    expect(usageRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-a",
        agentName: "conversation-agent",
      }),
    );
    expect(flowExecutionQueueService.enqueue).toHaveBeenCalledWith(
      "execute.reply-conversation",
      expect.objectContaining({
        externalMessageId: "telegram:1",
      }),
    );
    expect(analyticsPublisherService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "analytics.agent.selected",
        tenantId: "tenant-a",
      }),
    );
    expect(agentTracePublisherService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "telegram_agent_execution",
      }),
    );
  });

  it("ignores unsupported inbound jobs", async () => {
    const processor = createProcessor();

    await processor.handleJob({
      id: "job-2",
      name: "unsupported.job",
      data: {
        channel: Channel.EMAIL,
        externalMessageId: "email:1",
      },
      attemptsMade: 0,
      opts: {},
    } as any);

    expect(logger.warn).toHaveBeenCalledWith(
      "Ignoring unsupported inbound job",
      InboundMessageProcessor.name,
      { jobName: "unsupported.job" },
    );
    expect(agentGraphService.execute).not.toHaveBeenCalled();
  });

  it("processes a non-telegram message without evaluation when no llm context exists", async () => {
    agentGraphService.execute.mockResolvedValueOnce({
      decision: {
        intent: "reply-conversation",
        confidence: 0.75,
        targetAgent: "conversation-agent",
        detectedLanguage: "pt",
      },
      executionRequest: {
        jobName: "execute.reply-conversation",
        payload: {
          channel: Channel.EMAIL,
          externalMessageId: "email:1",
          context: {
            body: "Preciso de ajuda com a fatura",
            metadata: {
              tenantId: "tenant-a",
            },
          },
        },
      },
      durationMs: 8,
    });

    const processor = createProcessor();

    await processor.handleJob({
      id: "job-4",
      name: EMAIL_RECEIVED_JOB,
      data: {
        eventType: "message.received",
        channel: Channel.EMAIL,
        externalMessageId: "email:1",
        from: "ada@example.com",
        body: "Preciso de ajuda com a fatura",
        receivedAt: "2026-03-15T12:00:00.000Z",
        metadata: {},
      },
      attemptsMade: 0,
      opts: {
        attempts: 3,
      },
    } as any);

    expect(responseEvaluatorService.evaluateResponse).not.toHaveBeenCalled();
    expect(outputFilterService.assertSafe).not.toHaveBeenCalled();
    expect(flowExecutionQueueService.enqueue).toHaveBeenCalledWith(
      "execute.reply-conversation",
      expect.objectContaining({
        externalMessageId: "email:1",
      }),
    );
  });

  it("skips evaluation side effects safely when evaluation is disabled", async () => {
    configService.get.mockImplementation((key: string, fallback?: unknown) => {
      const values: Record<string, unknown> = {
        "queue.inbound.name": INBOUND_MESSAGES_QUEUE,
        "queue.inbound.concurrency": 3,
        "queue.inbound.attempts": 3,
        "features.evaluationEnabled": false,
      };
      return values[key] ?? fallback;
    });

    const processor = createProcessor();

    await processor.handleJob({
      id: "job-6",
      name: TELEGRAM_RECEIVED_JOB,
      data: {
        eventType: "message.received",
        channel: Channel.TELEGRAM,
        externalMessageId: "telegram:6",
        conversationId: "1001",
        from: "ada",
        body: "hello",
        receivedAt: "2026-03-15T12:00:00.000Z",
        metadata: {
          telegramChatId: "1001",
        },
      },
      attemptsMade: 0,
      opts: {
        attempts: 3,
      },
    } as any);

    expect(outputFilterService.assertSafe).not.toHaveBeenCalled();
    expect(responseEvaluatorService.evaluateResponse).not.toHaveBeenCalled();
    expect(evaluationRepository.saveEvaluation).not.toHaveBeenCalled();
    expect(usageRepository.save).not.toHaveBeenCalled();
    expect(flowExecutionQueueService.enqueue).toHaveBeenCalledWith(
      "execute.reply-conversation",
      expect.objectContaining({
        externalMessageId: "telegram:1",
      }),
    );
    expect(agentTracePublisherService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "evaluation_skipped",
      }),
    );
  });

  it("sends final failures to the inbound dead-letter queue and closes the worker", async () => {
    const processor = createProcessor();
    processor.onModuleInit();

    workerState.events.failed?.(
      {
        id: "job-3",
        name: EMAIL_RECEIVED_JOB,
        data: {
          channel: Channel.EMAIL,
          externalMessageId: "email:3",
        },
        attemptsMade: 3,
        opts: {
          attempts: 3,
        },
      },
      new Error("inbound crashed"),
    );

    expect(deadLetterQueueService.enqueueInboundFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        jobName: EMAIL_RECEIVED_JOB,
        payload: expect.objectContaining({
          externalMessageId: "email:3",
        }),
      }),
    );

    await processor.onModuleDestroy();
    expect(workerState.close).toHaveBeenCalled();
  });

  it("does not enqueue inbound dead-letter entries before the final retry attempt", () => {
    const processor = createProcessor();
    processor.onModuleInit();

    workerState.events.failed?.(
      {
        id: "job-5",
        name: EMAIL_RECEIVED_JOB,
        data: {
          channel: Channel.EMAIL,
          externalMessageId: "email:5",
        },
        attemptsMade: 1,
        opts: {
          attempts: 3,
        },
      },
      new Error("temporary inbound error"),
    );

    expect(deadLetterQueueService.enqueueInboundFailure).not.toHaveBeenCalled();
  });
});
