import { TelegramCommandService } from "./telegram-command.service";

describe("TelegramCommandService", () => {
  it("returns a welcome message for /start", () => {
    const configService = {
      get: jest.fn().mockReturnValue("rag_demo_bot"),
    } as any;
    const service = new TelegramCommandService(configService);

    expect(service.resolve("/start")).toContain("@rag_demo_bot");
  });

  it("returns null for regular messages", () => {
    const configService = { get: jest.fn() } as any;
    const service = new TelegramCommandService(configService);

    expect(service.resolve("hello")).toBeNull();
  });
});
