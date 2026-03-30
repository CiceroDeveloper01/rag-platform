import { AppLoggerService } from "@rag-platform/observability";
import { SupervisorAgent } from "./supervisor.agent";
import { LanguageDetectionService } from "../language-detection.service";

describe("SupervisorAgent", () => {
  function createAgent(pendingConfirmation = false) {
    return new SupervisorAgent(
      { debug: jest.fn() } as unknown as AppLoggerService,
      new LanguageDetectionService(),
      {
        getPendingConfirmationState: jest.fn().mockResolvedValue(
          pendingConfirmation
            ? {
                type: "banking_state",
                confirmationPending: true,
                intent: "CARD_SERVICES",
                specialist: "card",
                operation: "BlockCard",
              }
            : null,
        ),
      } as any,
    );
  }

  it("routes document messages to the document-agent based on canonical messageType", async () => {
    const agent = createAgent();

    const decision = await agent.decide({
      eventType: "message.received",
      channel: "TELEGRAM" as never,
      externalMessageId: "doc-1",
      from: "ada",
      body: "billing-policy.pdf",
      messageType: "document",
      document: {
        providerFileId: "file-123",
        fileName: "billing-policy.pdf",
        mimeType: "application/pdf",
      },
      receivedAt: new Date().toISOString(),
    });

    expect(decision.targetAgent).toBe("document-agent");
    expect(decision.intent).toBe("register-document");
  });

  it("routes attachment-related text to the document-agent", async () => {
    const agent = createAgent();

    const decision = await agent.decide({
      eventType: "message.received",
      channel: "EMAIL" as never,
      externalMessageId: "doc-2",
      from: "ada",
      body: "Segue o pdf com o documento financeiro",
      receivedAt: new Date().toISOString(),
    });

    expect(decision.targetAgent).toBe("document-agent");
  });

  it("routes urgent human-support requests to the handoff agent", async () => {
    const agent = createAgent();

    const decision = await agent.decide({
      eventType: "message.received",
      channel: "WHATSAPP" as never,
      externalMessageId: "handoff-1",
      from: "ada",
      body: "Preciso de suporte humano urgente",
      receivedAt: new Date().toISOString(),
    });

    expect(decision.targetAgent).toBe("handoff-agent");
    expect(decision.intent).toBe("handoff");
  });

  it("defaults to the conversation-agent for regular text messages", async () => {
    const agent = createAgent();

    const decision = await agent.decide({
      eventType: "message.received",
      channel: "TELEGRAM" as never,
      externalMessageId: "msg-1",
      from: "ada",
      body: "How do I reset my password?",
      receivedAt: new Date().toISOString(),
    });

    expect(decision.targetAgent).toBe("conversation-agent");
    expect(decision.intent).toBe("reply-conversation");
  });

  it("routes english banking requests to the account-manager-agent", async () => {
    const agent = createAgent();

    const decision = await agent.decide({
      eventType: "message.received",
      channel: "TELEGRAM" as never,
      externalMessageId: "bank-1",
      from: "ada",
      body: "I lost my card",
      receivedAt: new Date().toISOString(),
    });

    expect(decision.targetAgent).toBe("account-manager-agent");
  });

  it("routes spanish banking requests to the account-manager-agent", async () => {
    const agent = createAgent();

    const decision = await agent.decide({
      eventType: "message.received",
      channel: "WHATSAPP" as never,
      externalMessageId: "bank-2",
      from: "ada",
      body: "tarjeta bloqueada",
      receivedAt: new Date().toISOString(),
    });

    expect(decision.targetAgent).toBe("account-manager-agent");
  });

  it("routes credit simulation requests to the account-manager-agent", async () => {
    const agent = createAgent();

    const decision = await agent.decide({
      eventType: "message.received",
      channel: "EMAIL" as never,
      externalMessageId: "bank-2b",
      from: "ada",
      body: "loan simulation",
      receivedAt: new Date().toISOString(),
    });

    expect(decision.targetAgent).toBe("account-manager-agent");
  });

  it("keeps pending sensitive confirmations in the banking branch", async () => {
    const agent = createAgent(true);

    const decision = await agent.decide({
      eventType: "message.received",
      channel: "TELEGRAM" as never,
      externalMessageId: "bank-3",
      conversationId: "conv-1",
      from: "ada",
      body: "yes",
      receivedAt: new Date().toISOString(),
    });

    expect(decision.targetAgent).toBe("account-manager-agent");
    expect(decision.intent).toBe("account-manager-pending-confirmation");
  });
});
