import { Channel } from "@rag-platform/contracts";
import {
  EXECUTE_REGISTER_DOCUMENT_JOB,
  FLOW_EXECUTION_QUEUE,
} from "../queue/queue.constants";
import { FlowExecutionProcessor } from "./flow-execution.processor";

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

describe("FlowExecutionProcessor worker lifecycle", () => {
  const logger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const metricsService = {
    increment: jest.fn(),
  };
  const agentTracePublisherService = {
    publish: jest.fn().mockResolvedValue(undefined),
  };
  const channelOutboundRouterService = {
    send: jest.fn().mockResolvedValue(undefined),
  };
  const documentIngestionPipelineService = {
    ingest: jest.fn().mockResolvedValue({
      documentId: "doc-1",
      fileName: "policy.pdf",
      chunkCount: 3,
    }),
  };
  const deadLetterQueueService = {
    enqueueFlowExecutionFailure: jest.fn().mockResolvedValue(undefined),
  };
  const configService = {
    get: jest.fn((key: string, fallback?: unknown) => {
      const values: Record<string, unknown> = {
        "queue.flowExecution.name": FLOW_EXECUTION_QUEUE,
        "queue.flowExecution.concurrency": 4,
        "queue.flowExecution.attempts": 3,
        "features.outboundSendingEnabled": true,
      };
      return values[key] ?? fallback;
    }),
  };

  function createProcessor() {
    return new FlowExecutionProcessor(
      configService as any,
      logger as any,
      metricsService as any,
      agentTracePublisherService as any,
      {
        compose: jest.fn().mockReturnValue("hello from RAG platform"),
        resolveRecipientId: jest.fn().mockReturnValue("1001"),
      } as any,
      channelOutboundRouterService as any,
      documentIngestionPipelineService as any,
      deadLetterQueueService as any,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    workerState.events = {};
    workerState.handler = undefined;
  });

  it("configures the worker and executes document registration jobs", async () => {
    const processor = createProcessor();
    processor.onModuleInit();

    expect(workerState.queueName).toBe(FLOW_EXECUTION_QUEUE);
    expect(workerState.options).toEqual(
      expect.objectContaining({
        concurrency: 4,
      }),
    );

    await workerState.handler?.({
      id: "flow-job-1",
      name: EXECUTE_REGISTER_DOCUMENT_JOB,
      data: {
        channel: Channel.TELEGRAM,
        externalMessageId: "telegram:doc-1",
        context: {
          body: "Monthly statement",
          text: "Monthly statement",
          messageType: "document",
          from: "ada",
          chatId: "1001",
          userId: "42",
          messageId: "77",
          document: {
            providerFileId: "file-1",
            fileName: "policy.pdf",
            mimeType: "application/pdf",
          },
          metadata: {
            tenantId: "tenant-a",
            telegramChatId: "1001",
          },
          receivedAt: "2026-03-15T12:00:00.000Z",
        },
      },
    });

    expect(documentIngestionPipelineService.ingest).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: Channel.TELEGRAM,
        document: expect.objectContaining({
          fileName: "policy.pdf",
        }),
      }),
    );
    expect(channelOutboundRouterService.send).toHaveBeenCalledWith(
      Channel.TELEGRAM,
      expect.objectContaining({
        recipientId: "1001",
        text: expect.stringContaining("indexed successfully"),
      }),
    );
  });

  it("pushes final flow execution failures to the dead-letter queue and closes the worker", async () => {
    const processor = createProcessor();
    processor.onModuleInit();

    workerState.events.failed?.(
      {
        id: "flow-job-2",
        name: EXECUTE_REGISTER_DOCUMENT_JOB,
        data: {
          channel: Channel.TELEGRAM,
          externalMessageId: "telegram:doc-2",
        },
        attemptsMade: 3,
        opts: {
          attempts: 3,
        },
      },
      new Error("flow crashed"),
    );

    expect(
      deadLetterQueueService.enqueueFlowExecutionFailure,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        queueName: FLOW_EXECUTION_QUEUE,
        jobName: EXECUTE_REGISTER_DOCUMENT_JOB,
      }),
    );

    await processor.onModuleDestroy();
    expect(workerState.close).toHaveBeenCalled();
  });

  it("does not enqueue dead-letter entries before the final retry attempt", () => {
    const processor = createProcessor();
    processor.onModuleInit();

    workerState.events.failed?.(
      {
        id: "flow-job-3",
        name: EXECUTE_REGISTER_DOCUMENT_JOB,
        data: {
          channel: Channel.TELEGRAM,
          externalMessageId: "telegram:doc-3",
        },
        attemptsMade: 1,
        opts: {
          attempts: 3,
        },
      },
      new Error("temporary error"),
    );

    expect(
      deadLetterQueueService.enqueueFlowExecutionFailure,
    ).not.toHaveBeenCalled();
  });

  it("indexes documents without sending an outbound message when no recipient can be resolved", async () => {
    const processor = createProcessor();

    await processor.handleJob({
      id: "flow-job-4",
      name: EXECUTE_REGISTER_DOCUMENT_JOB,
      data: {
        channel: Channel.TELEGRAM,
        externalMessageId: "telegram:doc-4",
        context: {
          body: "Body only",
        },
      },
    } as any);

    expect(documentIngestionPipelineService.ingest).toHaveBeenCalledWith(
      expect.objectContaining({
        body: "Body only",
      }),
    );
    expect(channelOutboundRouterService.send).not.toHaveBeenCalled();
  });

  it("does not send document acknowledgements when outbound sending is disabled", async () => {
    configService.get.mockImplementation((key: string, fallback?: unknown) => {
      const values: Record<string, unknown> = {
        "queue.flowExecution.name": FLOW_EXECUTION_QUEUE,
        "queue.flowExecution.concurrency": 4,
        "queue.flowExecution.attempts": 3,
        "features.outboundSendingEnabled": false,
      };
      return values[key] ?? fallback;
    });

    const processor = createProcessor();

    await processor.handleJob({
      id: "flow-job-5",
      name: EXECUTE_REGISTER_DOCUMENT_JOB,
      data: {
        channel: Channel.TELEGRAM,
        externalMessageId: "telegram:doc-5",
        context: {
          body: "Monthly statement",
          metadata: {
            tenantId: "tenant-a",
            telegramChatId: "1001",
          },
        },
      },
    } as any);

    expect(documentIngestionPipelineService.ingest).toHaveBeenCalled();
    expect(channelOutboundRouterService.send).not.toHaveBeenCalled();
    expect(agentTracePublisherService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "outbound_delivery_skipped",
      }),
    );
  });
});
