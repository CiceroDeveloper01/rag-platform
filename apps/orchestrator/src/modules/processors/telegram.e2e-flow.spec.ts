import { Channel } from "@rag-platform/contracts";
import { TelegramInboundAdapter } from "../channels/telegram.inbound.adapter";
import { TelegramCommandService } from "../channels/telegram-command.service";
import { TelegramResponseComposerService } from "../channels/telegram-response-composer.service";
import { InboundMessageProcessor } from "./inbound-message.processor";
import { FlowExecutionProcessor } from "./flow-execution.processor";

describe("Telegram end-to-end flow", () => {
  it("processes an inbound telegram hello and sends the outbound demo response", async () => {
    const adapter = new TelegramInboundAdapter();
    const enqueuedJobs: Array<{ name: string; payload: any }> = [];
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
            externalMessageId: "501:99",
            context: {
              body: "hello",
              conversationId: "1001",
              language: "en",
              metadata: {
                tenantId: "tenant-a",
                telegramChatId: 1001,
              },
            },
          },
        },
        durationMs: 12,
      }),
    } as any;
    const inboundProcessor = new InboundMessageProcessor(
      {
        get: jest.fn((key: string, defaultValue?: unknown) => {
          const values: Record<string, unknown> = {
            "features.evaluationEnabled": true,
          };
          return values[key] ?? defaultValue;
        }),
      } as any,
      { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as any,
      { increment: jest.fn() } as any,
      { publish: jest.fn().mockResolvedValue(undefined) } as any,
      { publish: jest.fn().mockResolvedValue(undefined) } as any,
      {
        attach: jest.fn().mockReturnValue({ tenantId: "tenant-a" }),
      } as any,
      {
        countInputTokens: jest.fn().mockReturnValue(10),
        countOutputTokens: jest.fn().mockReturnValue(10),
      } as any,
      { calculateCost: jest.fn().mockReturnValue(0.01) } as any,
      {
        save: jest.fn(),
        summarizeByAgent: jest.fn().mockReturnValue([]),
        summarizeByTenant: jest.fn().mockReturnValue([]),
      } as any,
      {
        evaluateResponse: jest.fn().mockReturnValue({
          relevanceScore: 1,
          coherenceScore: 1,
          safetyScore: 1,
        }),
      } as any,
      { saveEvaluation: jest.fn() } as any,
      {
        getAgentQuality: jest
          .fn()
          .mockReturnValue({ averageQualityScore: 1, failureRate: 0 }),
      } as any,
      { assertSafe: jest.fn() } as any,
      { assertAuthorized: jest.fn() } as any,
      { assertValid: jest.fn() } as any,
      { assertSafe: jest.fn() } as any,
      agentGraphService,
      {
        enqueue: jest.fn().mockImplementation(async (name, payload) => {
          enqueuedJobs.push({ name, payload });
        }),
      } as any,
      { enqueueInboundFailure: jest.fn() } as any,
    );
    const outboundRouterService = {
      send: jest.fn().mockResolvedValue(undefined),
    } as any;
    const flowExecutionProcessor = new FlowExecutionProcessor(
      {
        get: jest.fn((key: string, defaultValue?: unknown) => {
          const values: Record<string, unknown> = {
            "features.outboundSendingEnabled": true,
          };
          return values[key] ?? defaultValue;
        }),
      } as any,
      { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as any,
      { increment: jest.fn() } as any,
      { publish: jest.fn().mockResolvedValue(undefined) } as any,
      new TelegramResponseComposerService(
        new TelegramCommandService({
          get: jest.fn().mockReturnValue("rag_demo_bot"),
        } as any),
      ),
      outboundRouterService,
      { ingest: jest.fn() } as any,
      { enqueueFlowExecutionFailure: jest.fn() } as any,
    );

    const payload = adapter.toInboundMessage({
      update_id: 501,
      message: {
        message_id: 99,
        date: 1_710_000_000,
        text: "hello",
        from: {
          id: 42,
          username: "ada",
        },
        chat: {
          id: 1001,
          type: "private",
        },
      },
    });

    await inboundProcessor.handleJob({
      id: "job-inbound-1",
      name: "telegram.received",
      data: payload!,
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as any);

    expect(enqueuedJobs).toHaveLength(1);

    await flowExecutionProcessor.handleJob({
      id: "job-flow-1",
      name: enqueuedJobs[0].name,
      data: enqueuedJobs[0].payload,
    } as any);

    expect(agentGraphService.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        externalMessageId: "501:99",
        body: "hello",
      }),
    );
    expect(outboundRouterService.send).toHaveBeenCalledWith(
      Channel.TELEGRAM,
      expect.objectContaining({
        recipientId: "1001",
        text: "hello from RAG platform",
      }),
    );
  });

  it("processes the inbound event but skips outbound delivery when safe mode disables sending", async () => {
    const adapter = new TelegramInboundAdapter();
    const enqueuedJobs: Array<{ name: string; payload: any }> = [];
    const inboundProcessor = new InboundMessageProcessor(
      {
        get: jest.fn((key: string, defaultValue?: unknown) => {
          const values: Record<string, unknown> = {
            "features.evaluationEnabled": false,
          };
          return values[key] ?? defaultValue;
        }),
      } as any,
      { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as any,
      { increment: jest.fn() } as any,
      { publish: jest.fn().mockResolvedValue(undefined) } as any,
      { publish: jest.fn().mockResolvedValue(undefined) } as any,
      { attach: jest.fn().mockReturnValue({ tenantId: "tenant-a" }) } as any,
      { countInputTokens: jest.fn(), countOutputTokens: jest.fn() } as any,
      { calculateCost: jest.fn() } as any,
      {
        save: jest.fn(),
        summarizeByAgent: jest.fn(),
        summarizeByTenant: jest.fn(),
      } as any,
      { evaluateResponse: jest.fn() } as any,
      { saveEvaluation: jest.fn() } as any,
      { getAgentQuality: jest.fn() } as any,
      { assertSafe: jest.fn() } as any,
      { assertAuthorized: jest.fn() } as any,
      { assertValid: jest.fn() } as any,
      { assertSafe: jest.fn() } as any,
      {
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
              externalMessageId: "502:99",
              context: {
                body: "hello",
                llmContext: "hello from RAG platform",
                conversationId: "1001",
                metadata: {
                  tenantId: "tenant-a",
                  telegramChatId: 1001,
                },
              },
            },
          },
          durationMs: 10,
        }),
      } as any,
      {
        enqueue: jest.fn().mockImplementation(async (name, payload) => {
          enqueuedJobs.push({ name, payload });
        }),
      } as any,
      { enqueueInboundFailure: jest.fn() } as any,
    );
    const outboundRouterService = {
      send: jest.fn().mockResolvedValue(undefined),
    } as any;
    const flowExecutionProcessor = new FlowExecutionProcessor(
      {
        get: jest.fn((key: string, defaultValue?: unknown) => {
          const values: Record<string, unknown> = {
            "features.outboundSendingEnabled": false,
          };
          return values[key] ?? defaultValue;
        }),
      } as any,
      { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as any,
      { increment: jest.fn() } as any,
      { publish: jest.fn().mockResolvedValue(undefined) } as any,
      new TelegramResponseComposerService(
        new TelegramCommandService({
          get: jest.fn().mockReturnValue("rag_demo_bot"),
        } as any),
      ),
      outboundRouterService,
      { ingest: jest.fn() } as any,
      { enqueueFlowExecutionFailure: jest.fn() } as any,
    );

    const payload = adapter.toInboundMessage({
      update_id: 502,
      message: {
        message_id: 99,
        date: 1_710_000_000,
        text: "hello",
        from: {
          id: 42,
          username: "ada",
        },
        chat: {
          id: 1001,
          type: "private",
        },
      },
    });

    await inboundProcessor.handleJob({
      id: "job-inbound-2",
      name: "telegram.received",
      data: payload!,
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as any);

    await flowExecutionProcessor.handleJob({
      id: "job-flow-2",
      name: enqueuedJobs[0].name,
      data: enqueuedJobs[0].payload,
    } as any);

    expect(enqueuedJobs).toHaveLength(1);
    expect(outboundRouterService.send).not.toHaveBeenCalled();
  });
});
