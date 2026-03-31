import { Channel } from "@rag-platform/contracts";
import { AccountManagerOrchestrator } from "./account-manager.orchestrator";

describe("AccountManagerOrchestrator", () => {
  it("continues a pending sensitive confirmation flow on the card specialist", async () => {
    const stateService = {
      getPendingConfirmationState: jest.fn().mockResolvedValue({
        type: "banking_state",
        confirmationPending: true,
        intent: "CARD_SERVICES",
        specialist: "card",
        operation: "BlockCard",
      }),
      storePendingConfirmation: jest.fn(),
      clearPendingConfirmation: jest.fn().mockResolvedValue(undefined),
    };
    const orchestrator = new AccountManagerOrchestrator(
      { log: jest.fn() } as any,
      { increment: jest.fn(), record: jest.fn() } as any,
      { classify: jest.fn() } as any,
      { evaluate: jest.fn().mockReturnValue({ blocked: false }) } as any,
      stateService as any,
      { createQueryEmbedding: jest.fn().mockReturnValue([0.1, 0.2]) } as any,
      { compose: jest.fn(({ specialistResult }) => ({
        responseText: specialistResult.responseText,
        responseMetadata: {},
      })) } as any,
      { execute: jest.fn() } as any,
      {
        execute: jest.fn().mockResolvedValue({
          responseText: "Bloqueio do cartao solicitado com sucesso.",
          usedRag: false,
          retrievedDocuments: [],
          toolCalls: ["BlockCard"],
        }),
      } as any,
      { execute: jest.fn() } as any,
      { execute: jest.fn() } as any,
      { execute: jest.fn() } as any,
      { execute: jest.fn() } as any,
    );

    const result = await orchestrator.execute({
      message: {
        eventType: "message.received",
        channel: Channel.TELEGRAM,
        externalMessageId: "telegram:confirm",
        conversationId: "conv-1",
        from: "user-1",
        body: "confirmo",
        receivedAt: new Date().toISOString(),
        metadata: {
          tenantId: "tenant-a",
        },
      },
      detectedLanguage: "pt",
    });

    expect(result.responseText).toContain("Bloqueio do cartao");
    expect(stateService.clearPendingConfirmation).toHaveBeenCalled();
  });
});
