import { TelegramOutboundService } from "./telegram.outbound.service";

describe("TelegramOutboundService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.Mock;
  });

  it("sends a telegram message through the bot api", async () => {
    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const values: Record<string, unknown> = {
          "listeners.telegram.botToken": "bot-token",
          "listeners.telegram.apiBaseUrl": "https://api.telegram.org",
        };

        return values[key] ?? defaultValue;
      }),
    } as any;
    const channelHttpClient = {
      requestJson: jest.fn().mockResolvedValue({ ok: true }),
    } as any;
    const service = new TelegramOutboundService(
      configService,
      channelHttpClient,
    );

    await expect(service.sendMessage(1001, "hello")).resolves.toBeUndefined();
    expect(channelHttpClient.requestJson).toHaveBeenCalledTimes(1);
    expect(channelHttpClient.requestJson).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "https://api.telegram.org/botbot-token/sendMessage",
      }),
    );
  });
});
