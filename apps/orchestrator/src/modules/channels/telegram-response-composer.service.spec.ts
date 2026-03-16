import { TelegramCommandService } from "./telegram-command.service";
import { TelegramResponseComposerService } from "./telegram-response-composer.service";

describe("TelegramResponseComposerService", () => {
  const service = new TelegramResponseComposerService(
    new TelegramCommandService({
      get: jest.fn().mockReturnValue("rag_demo_bot"),
    } as any),
  );

  it("returns command responses before any other fallback", () => {
    expect(
      service.compose({
        channel: "telegram" as any,
        externalMessageId: "msg-1",
        context: {
          body: "/help",
        },
      }),
    ).toContain("/start - welcome message");
  });

  it("returns the demo greeting for hello payloads", () => {
    expect(
      service.compose({
        channel: "telegram" as any,
        externalMessageId: "msg-1",
        context: {
          body: " hello ",
        },
      }),
    ).toBe("hello from RAG platform");
  });

  it("uses an explicit response text when present", () => {
    expect(
      service.compose({
        channel: "telegram" as any,
        externalMessageId: "msg-1",
        context: {
          responseText: "Custom response",
        },
      }),
    ).toBe("Custom response");
  });

  it("falls back to the localized default response", () => {
    expect(
      service.compose({
        channel: "telegram" as any,
        externalMessageId: "msg-1",
        context: {
          language: "es",
        },
      }),
    ).toBe("Recibimos tu mensaje y la plataforma lo proceso correctamente.");
  });

  it("resolves the recipient id from metadata first and conversation id second", () => {
    expect(
      service.resolveRecipientId({
        channel: "telegram" as any,
        externalMessageId: "msg-1",
        context: {
          metadata: {
            telegramChatId: 1001,
          },
        },
      }),
    ).toBe("1001");

    expect(
      service.resolveRecipientId({
        channel: "telegram" as any,
        externalMessageId: "msg-1",
        context: {
          conversationId: "2002",
        },
      }),
    ).toBe("2002");
  });

  it("throws when there is no Telegram recipient information", () => {
    expect(() =>
      service.resolveRecipientId({
        channel: "telegram" as any,
        externalMessageId: "msg-1",
        context: {},
      }),
    ).toThrow(
      "Telegram recipient chat id is missing from flow execution context",
    );
  });
});
