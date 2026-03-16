import { Channel } from "@rag-platform/contracts";
import { TelegramInboundAdapter } from "./telegram.inbound.adapter";

describe("TelegramInboundAdapter", () => {
  it("maps a telegram update into an inbound message payload", () => {
    const adapter = new TelegramInboundAdapter();

    const payload = adapter.toInboundMessage({
      update_id: 501,
      message: {
        message_id: 99,
        date: 1_710_000_000,
        text: "Where is my invoice?",
        from: {
          id: 42,
          first_name: "Ada",
          username: "ada",
        },
        chat: {
          id: 1001,
          type: "private",
        },
      },
    });

    expect(payload).toEqual(
      expect.objectContaining({
        channel: Channel.TELEGRAM,
        eventType: "message.received",
        externalMessageId: "501:99",
        conversationId: "1001",
        from: "ada",
        body: "Where is my invoice?",
      }),
    );
    expect(payload?.metadata).toEqual(
      expect.objectContaining({
        telegramChatId: 1001,
        telegramUserId: 42,
        updateId: 501,
        messageId: 99,
      }),
    );
  });

  it("returns null when the update does not carry a text-like message", () => {
    const adapter = new TelegramInboundAdapter();

    const payload = adapter.toInboundMessage({
      update_id: 777,
    });

    expect(payload).toBeNull();
  });

  it("maps telegram documents into the canonical document payload", () => {
    const adapter = new TelegramInboundAdapter();

    const payload = adapter.toInboundMessage({
      update_id: 700,
      message: {
        message_id: 77,
        date: 1_710_000_000,
        caption: "Monthly statement",
        document: {
          file_id: "telegram-file-1",
          file_name: "statement.pdf",
          mime_type: "application/pdf",
          file_size: 2048,
        },
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

    expect(payload).toEqual(
      expect.objectContaining({
        messageType: "document",
        text: "Monthly statement",
        chatId: "1001",
        messageId: "77",
        userId: "42",
        document: expect.objectContaining({
          providerFileId: "telegram-file-1",
          fileName: "statement.pdf",
          mimeType: "application/pdf",
          fileSize: 2048,
        }),
      }),
    );
  });

  it("maps telegram commands and sender fallbacks correctly", () => {
    const adapter = new TelegramInboundAdapter();

    const payload = adapter.toInboundMessage({
      update_id: 701,
      edited_message: {
        message_id: 78,
        date: 1_710_000_001,
        text: "/status",
        from: {
          id: 43,
          first_name: "Ada",
          last_name: "Lovelace",
        },
        chat: {
          id: 1002,
          type: "private",
        },
      },
    });

    expect(payload).toEqual(
      expect.objectContaining({
        messageType: "command",
        from: "Ada Lovelace",
        body: "/status",
      }),
    );
  });

  it("returns null when the message body resolves to an empty string", () => {
    const adapter = new TelegramInboundAdapter();

    expect(
      adapter.toInboundMessage({
        update_id: 702,
        message: {
          message_id: 79,
          date: 1_710_000_002,
          caption: "   ",
          chat: {
            id: 1003,
            type: "private",
          },
        },
      } as any),
    ).toBeNull();
  });

  it("uses the document file name as the body fallback when caption and text are missing", () => {
    const adapter = new TelegramInboundAdapter();

    const payload = adapter.toInboundMessage({
      update_id: 703,
      message: {
        message_id: 80,
        date: 1_710_000_003,
        document: {
          file_id: "telegram-file-2",
          file_name: "handbook.pdf",
        },
        chat: {
          id: 1004,
          type: "private",
        },
      },
    } as any);

    expect(payload).toEqual(
      expect.objectContaining({
        body: "handbook.pdf",
        attachments: [
          expect.objectContaining({
            fileName: "handbook.pdf",
          }),
        ],
      }),
    );
  });
});
