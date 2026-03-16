import { Channel } from "@rag-platform/contracts";
import { EmailInboundAdapter } from "./email.inbound.adapter";

describe("EmailInboundAdapter", () => {
  it("maps an email payload into an inbound message payload", () => {
    const adapter = new EmailInboundAdapter();

    const payload = adapter.toInboundMessage({
      externalMessageId: "mail-42",
      fromEmail: "billing@rag.dev",
      fromName: "Billing Team",
      toEmail: "support@rag.dev",
      subject: "Invoice question",
      body: "Please share my invoice",
      conversationId: "thread-9",
      receivedAt: "2026-03-15T12:00:00.000Z",
      metadata: {
        threadId: "thread-9",
      },
    });

    expect(payload).toEqual(
      expect.objectContaining({
        channel: Channel.EMAIL,
        externalMessageId: "mail-42",
        conversationId: "thread-9",
        from: "Billing Team",
        subject: "Invoice question",
        body: "Please share my invoice",
      }),
    );
    expect(payload?.metadata).toEqual(
      expect.objectContaining({
        fromEmail: "billing@rag.dev",
        toEmail: "support@rag.dev",
        threadId: "thread-9",
      }),
    );
  });

  it("returns null for blank emails", () => {
    const adapter = new EmailInboundAdapter();

    expect(
      adapter.toInboundMessage({
        externalMessageId: "mail-empty",
        fromEmail: "billing@rag.dev",
        body: "   ",
      }),
    ).toBeNull();
  });
});
