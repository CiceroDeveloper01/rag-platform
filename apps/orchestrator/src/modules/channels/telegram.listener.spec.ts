import { Channel } from "@rag-platform/contracts";
import { TelegramListener } from "./telegram.listener";

describe("TelegramListener", () => {
  it("starts polling when telegram is enabled in polling mode", async () => {
    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const values: Record<string, unknown> = {
          "listeners.telegram.enabled": true,
          "listeners.telegram.mode": "polling",
          "listeners.telegram.botToken": "bot-token",
          "listeners.telegram.botUsername": "rag_demo_bot",
        };

        return values[key] ?? defaultValue;
      }),
    } as any;
    const telegramPollingService = {
      start: jest.fn().mockResolvedValue(undefined),
    } as any;
    const logger = {
      log: jest.fn(),
      warn: jest.fn(),
    } as any;
    const inboundMessagesQueueService = {} as any;

    const listener = new TelegramListener(
      configService,
      telegramPollingService,
      { increment: jest.fn() } as any,
      { publish: jest.fn().mockResolvedValue(undefined) } as any,
      logger,
      inboundMessagesQueueService,
    );

    await listener.start();

    expect(listener.channel).toBe(Channel.TELEGRAM);
    expect(telegramPollingService.start).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalled();
  });

  it("fails fast when required telegram bootstrap config is missing", async () => {
    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const values: Record<string, unknown> = {
          "listeners.telegram.enabled": true,
          "listeners.telegram.mode": "polling",
          "listeners.telegram.botToken": "",
          "listeners.telegram.botUsername": "",
        };

        return values[key] ?? defaultValue;
      }),
    } as any;
    const telegramPollingService = {
      start: jest.fn().mockResolvedValue(undefined),
    } as any;
    const logger = {
      log: jest.fn(),
      warn: jest.fn(),
    } as any;
    const inboundMessagesQueueService = {} as any;

    const listener = new TelegramListener(
      configService,
      telegramPollingService,
      { increment: jest.fn() } as any,
      { publish: jest.fn().mockResolvedValue(undefined) } as any,
      logger,
      inboundMessagesQueueService,
    );

    await expect(listener.start()).rejects.toThrow("TELEGRAM_BOT_TOKEN");

    expect(telegramPollingService.start).not.toHaveBeenCalled();
  });

  it("does not start polling when telegram is disabled", async () => {
    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const values: Record<string, unknown> = {
          "listeners.telegram.enabled": false,
        };

        return values[key] ?? defaultValue;
      }),
    } as any;
    const telegramPollingService = {
      start: jest.fn().mockResolvedValue(undefined),
    } as any;
    const logger = {
      log: jest.fn(),
      warn: jest.fn(),
    } as any;

    const listener = new TelegramListener(
      configService,
      telegramPollingService,
      { increment: jest.fn() } as any,
      { publish: jest.fn().mockResolvedValue(undefined) } as any,
      logger,
      {} as any,
    );

    await listener.start();

    expect(telegramPollingService.start).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });
});
