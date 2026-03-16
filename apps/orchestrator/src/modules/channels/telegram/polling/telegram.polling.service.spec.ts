import {
  AppLoggerService,
  MetricsService,
  TracingService,
} from "@rag-platform/observability";
import { TelegramInboundAdapter } from "../inbound/telegram.inbound.adapter";
import { TelegramPollingService } from "./telegram.polling.service";

describe("TelegramPollingService", () => {
  it("fetches updates and publishes mapped inbound messages", async () => {
    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const values: Record<string, unknown> = {
          "listeners.telegram.botToken": "bot-token",
          "listeners.telegram.apiBaseUrl": "https://api.telegram.org",
          "listeners.telegram.pollingIntervalMs": 1000,
          "listeners.telegram.retryEnabled": true,
          "listeners.telegram.retryMaxAttempts": 3,
          "listeners.telegram.retryInitialDelayMs": 250,
          "listeners.telegram.retryMaxDelayMs": 2000,
        };

        return values[key] ?? defaultValue;
      }),
    } as any;
    const logger = {
      debug: jest.fn(),
      error: jest.fn(),
    } as unknown as AppLoggerService;
    const metricsService = {
      increment: jest.fn(),
    } as unknown as MetricsService;
    const tracingService = {
      startSpan: jest
        .fn()
        .mockReturnValue({ name: "telegram_update_received" }),
      endSpan: jest.fn(),
    } as unknown as TracingService;
    const agentTracePublisherService = {
      publish: jest.fn().mockResolvedValue(undefined),
    } as any;
    const channelHttpClient = {
      requestJson: jest.fn().mockResolvedValue({
        ok: true,
        result: [
          {
            update_id: 501,
            message: {
              message_id: 99,
              date: 1_710_000_000,
              text: "hello",
              from: { id: 42, username: "ada" },
              chat: { id: 1001, type: "private" },
            },
          },
        ],
      }),
    } as any;
    const service = new TelegramPollingService(
      configService,
      logger,
      metricsService,
      tracingService,
      agentTracePublisherService,
      channelHttpClient,
      new TelegramInboundAdapter(),
    );
    const publishInboundMessage = jest.fn().mockResolvedValue(undefined);

    await service.start(publishInboundMessage);
    await service.onModuleDestroy();

    expect(channelHttpClient.requestJson).toHaveBeenCalledTimes(1);
    expect(publishInboundMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        externalMessageId: "501:99",
        conversationId: "1001",
        body: "hello",
      }),
    );
    expect(agentTracePublisherService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "telegram_update_received",
      }),
    );
  });
});
