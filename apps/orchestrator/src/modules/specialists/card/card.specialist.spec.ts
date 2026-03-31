import { CardSpecialist } from "./card.specialist";

describe("CardSpecialist", () => {
  function buildContext(body: string) {
    return {
      message: {
        eventType: "message.received",
        channel: "telegram",
        externalMessageId: "msg-1",
        from: "user-1",
        body,
        receivedAt: new Date().toISOString(),
      },
      tenantId: "tenant-a",
      detectedLanguage: "pt",
      decision: {
        intent: "CARD_SERVICES",
        strategy: "TOOL",
        specialist: "card",
        suggestedTools: ["GetCardInfo"],
        confidence: 0.9,
        sensitivity: "normal",
        requiresHumanHandoff: false,
      },
    } as any;
  }

  it("returns a confirmation prompt before executing a sensitive block", async () => {
    const specialist = new CardSpecialist(
      {
        evaluateSensitiveOperation: jest.fn().mockReturnValue({
          allowed: false,
          responseText: "Confirme o bloqueio do cartao.",
        }),
      } as any,
      { execute: jest.fn() } as any,
      { execute: jest.fn() } as any,
    );

    const result = await specialist.execute({
      ...buildContext("Perdi meu cartao"),
      decision: {
        ...buildContext("Perdi meu cartao").decision,
        sensitivity: "sensitive",
      },
    });

    expect(result.responseText).toBe("Confirme o bloqueio do cartao.");
    expect(result.toolCalls).toEqual([]);
  });

  it("executes the card block tool after confirmation", async () => {
    const cardInfoTool = {
      name: "GetCardInfo",
      execute: jest.fn().mockResolvedValue({
        success: true,
        data: {
          cardId: "card-001",
          status: "ACTIVE",
          limit: 18000,
          invoiceAmount: 1280.44,
          invoiceDueDate: "2026-04-10",
        },
      }),
    };
    const blockTool = {
      name: "BlockCard",
      execute: jest.fn().mockResolvedValue({
        success: true,
        data: {
          status: "blocked",
          protocol: "BLK-2026-0001",
        },
      }),
    };
    const specialist = new CardSpecialist(
      {
        evaluateSensitiveOperation: jest.fn().mockReturnValue({
          allowed: true,
        }),
      } as any,
      cardInfoTool as any,
      blockTool as any,
    );

    const result = await specialist.execute({
      ...buildContext("confirmo o bloqueio"),
      decision: {
        ...buildContext("confirmo o bloqueio").decision,
        sensitivity: "sensitive",
      },
    });

    expect(cardInfoTool.execute).toHaveBeenCalled();
    expect(blockTool.execute).toHaveBeenCalled();
    expect(result.toolCalls).toEqual(["BlockCard"]);
    expect(result.responseText).toContain("BLK-2026-0001");
  });

  it("returns card info for card inquiries", async () => {
    const cardInfoTool = {
      name: "GetCardInfo",
      execute: jest.fn().mockResolvedValue({
        success: true,
        data: {
          status: "active",
          limit: 18000,
          invoiceAmount: 1280.44,
          invoiceDueDate: "2026-04-10",
        },
      }),
    };
    const specialist = new CardSpecialist(
      { evaluateSensitiveOperation: jest.fn() } as any,
      cardInfoTool as any,
      { execute: jest.fn() } as any,
    );

    const result = await specialist.execute(buildContext("Qual o limite do meu cartao?"));

    expect(cardInfoTool.execute).toHaveBeenCalled();
    expect(result.toolCalls).toEqual(["GetCardInfo"]);
    expect(result.responseText).toContain("R$ 18000.00");
  });

  it("returns a controlled message when card info lookup fails during block", async () => {
    const specialist = new CardSpecialist(
      {
        evaluateSensitiveOperation: jest.fn().mockReturnValue({
          allowed: true,
        }),
      } as any,
      {
        name: "GetCardInfo",
        execute: jest.fn().mockResolvedValue({
          success: false,
          error: "upstream_failed",
        }),
      } as any,
      { name: "BlockCard", execute: jest.fn() } as any,
    );

    const result = await specialist.execute({
      ...buildContext("confirmo o bloqueio"),
      decision: {
        ...buildContext("confirmo o bloqueio").decision,
        sensitivity: "sensitive",
      },
    });

    expect(result.responseText).toContain("Nao consegui identificar");
  });
});
