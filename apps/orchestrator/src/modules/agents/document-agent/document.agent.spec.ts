import { EXECUTE_REGISTER_DOCUMENT_JOB } from "../../queue/queue.constants";
import { DocumentAgent } from "./document.agent";

describe("DocumentAgent", () => {
  it("creates a channel-agnostic document registration plan", async () => {
    const agent = new DocumentAgent({ log: jest.fn() } as any);

    const result = await agent.plan(
      {
        eventType: "message.received",
        channel: "telegram",
        externalMessageId: "doc-1",
        from: "ada",
        body: "Monthly statement",
        text: "Monthly statement",
        chatId: "1001",
        userId: "42",
        messageId: "77",
        messageType: "document",
        document: {
          providerFileId: "file-1",
          fileName: "statement.pdf",
          mimeType: "application/pdf",
          fileSize: 2048,
        },
        attachments: [],
        metadata: {
          tenantId: "tenant-a",
        },
        receivedAt: "2026-03-15T12:00:00.000Z",
      } as any,
      {
        intent: "register-document",
        confidence: 0.98,
        targetAgent: "document-agent",
        detectedLanguage: "en",
        languageConfidence: 0.9,
        languageUsedFallback: false,
      },
    );

    expect(result).toEqual({
      jobName: EXECUTE_REGISTER_DOCUMENT_JOB,
      payload: expect.objectContaining({
        channel: "telegram",
        externalMessageId: "doc-1",
        context: expect.objectContaining({
          chatId: "1001",
          userId: "42",
          messageId: "77",
          messageType: "document",
          document: expect.objectContaining({
            fileName: "statement.pdf",
          }),
          metadata: expect.objectContaining({
            tenantId: "tenant-a",
          }),
        }),
      }),
    });
  });

  it("defaults the canonical messageType to document when none is provided", async () => {
    const agent = new DocumentAgent({ log: jest.fn() } as any);

    const result = await agent.plan(
      {
        eventType: "message.received",
        channel: "email",
        externalMessageId: "doc-2",
        from: "ada@example.com",
        body: "See attachment",
        receivedAt: "2026-03-15T12:00:00.000Z",
      } as any,
      {
        intent: "register-document",
        confidence: 0.9,
        targetAgent: "document-agent",
        detectedLanguage: "pt",
        languageConfidence: 0.7,
        languageUsedFallback: true,
      },
    );

    expect(result.payload.context?.messageType).toBe("document");
  });
});
