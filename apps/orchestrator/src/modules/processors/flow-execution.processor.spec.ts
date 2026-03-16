import { Channel } from "@rag-platform/contracts";
import { ChannelOutboundRouterService } from "../channels/channel-outbound-router.service";
import { TelegramCommandService } from "../channels/telegram-command.service";
import { TelegramResponseComposerService } from "../channels/telegram-response-composer.service";
import { FlowExecutionProcessor } from "./flow-execution.processor";

describe("FlowExecutionProcessor", () => {
  it("sends the demo reply for hello messages", async () => {
    const channelOutboundRouterService = {
      send: jest.fn().mockResolvedValue(undefined),
    } as any;
    const processor = new FlowExecutionProcessor(
      {
        get: jest.fn((key: string, defaultValue?: unknown) => {
          if (key === "features.outboundSendingEnabled") {
            return true;
          }
          return defaultValue;
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
      channelOutboundRouterService as unknown as ChannelOutboundRouterService,
      { ingest: jest.fn() } as any,
      { enqueueFlowExecutionFailure: jest.fn() } as any,
    );

    await processor.handleJob({
      id: "job-1",
      name: "execute.reply-conversation",
      data: {
        channel: Channel.TELEGRAM,
        externalMessageId: "telegram:1",
        context: {
          body: "hello",
          conversationId: "1001",
          metadata: {
            tenantId: "tenant-a",
            telegramChatId: 1001,
          },
        },
      },
    } as any);

    expect(channelOutboundRouterService.send).toHaveBeenCalledWith(
      Channel.TELEGRAM,
      expect.objectContaining({
        recipientId: "1001",
        text: "hello from RAG platform",
      }),
    );
  });

  it("responds to /help with the command list", async () => {
    const channelOutboundRouterService = {
      send: jest.fn().mockResolvedValue(undefined),
    } as any;
    const processor = new FlowExecutionProcessor(
      {
        get: jest.fn((key: string, defaultValue?: unknown) => {
          if (key === "features.outboundSendingEnabled") {
            return true;
          }
          return defaultValue;
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
      channelOutboundRouterService as unknown as ChannelOutboundRouterService,
      { ingest: jest.fn() } as any,
      { enqueueFlowExecutionFailure: jest.fn() } as any,
    );

    await processor.handleJob({
      id: "job-2",
      name: "execute.reply-conversation",
      data: {
        channel: Channel.TELEGRAM,
        externalMessageId: "telegram:2",
        context: {
          body: "/help",
          conversationId: "1001",
          metadata: {
            tenantId: "tenant-a",
            telegramChatId: 1001,
          },
        },
      },
    } as any);

    expect(channelOutboundRouterService.send).toHaveBeenCalledWith(
      Channel.TELEGRAM,
      expect.objectContaining({
        recipientId: "1001",
        text: expect.stringContaining("/status - platform status"),
      }),
    );
  });

  it("ignores unsupported flow execution jobs", async () => {
    const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as any;
    const processor = new FlowExecutionProcessor(
      {
        get: jest.fn((key: string, defaultValue?: unknown) => {
          if (key === "features.outboundSendingEnabled") {
            return true;
          }
          return defaultValue;
        }),
      } as any,
      logger,
      { increment: jest.fn() } as any,
      { publish: jest.fn().mockResolvedValue(undefined) } as any,
      new TelegramResponseComposerService(
        new TelegramCommandService({
          get: jest.fn().mockReturnValue("rag_demo_bot"),
        } as any),
      ),
      { send: jest.fn() } as any,
      { ingest: jest.fn() } as any,
      { enqueueFlowExecutionFailure: jest.fn() } as any,
    );

    await processor.handleJob({
      id: "job-3",
      name: "unsupported.job",
      data: {
        channel: Channel.TELEGRAM,
        externalMessageId: "telegram:3",
        context: {},
      },
    } as any);

    expect(logger.warn).toHaveBeenCalledWith(
      "Ignoring unsupported flow execution job",
      FlowExecutionProcessor.name,
      { jobName: "unsupported.job" },
    );
  });

  it("skips outbound delivery safely when outbound sending is disabled", async () => {
    const channelOutboundRouterService = {
      send: jest.fn().mockResolvedValue(undefined),
    } as any;
    const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as any;
    const agentTracePublisherService = {
      publish: jest.fn().mockResolvedValue(undefined),
    } as any;
    const processor = new FlowExecutionProcessor(
      {
        get: jest.fn((key: string, defaultValue?: unknown) => {
          if (key === "features.outboundSendingEnabled") {
            return false;
          }
          return defaultValue;
        }),
      } as any,
      logger,
      { increment: jest.fn() } as any,
      agentTracePublisherService,
      new TelegramResponseComposerService(
        new TelegramCommandService({
          get: jest.fn().mockReturnValue("rag_demo_bot"),
        } as any),
      ),
      channelOutboundRouterService as unknown as ChannelOutboundRouterService,
      { ingest: jest.fn() } as any,
      { enqueueFlowExecutionFailure: jest.fn() } as any,
    );

    await processor.handleJob({
      id: "job-4",
      name: "execute.reply-conversation",
      data: {
        channel: Channel.TELEGRAM,
        externalMessageId: "telegram:4",
        context: {
          body: "hello",
          conversationId: "1001",
          metadata: {
            tenantId: "tenant-a",
            telegramChatId: 1001,
          },
        },
      },
    } as any);

    expect(channelOutboundRouterService.send).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      "Outbound delivery skipped because the feature toggle is disabled",
      FlowExecutionProcessor.name,
      expect.objectContaining({
        channel: Channel.TELEGRAM,
        externalMessageId: "telegram:4",
      }),
    );
    expect(agentTracePublisherService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "outbound_delivery_skipped",
      }),
    );
  });
});
