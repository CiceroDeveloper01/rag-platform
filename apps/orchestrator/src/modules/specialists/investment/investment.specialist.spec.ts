import { InvestmentSpecialist } from "./investment.specialist";

describe("InvestmentSpecialist", () => {
  function buildContext(body: string) {
    return {
      message: {
        eventType: "message.received",
        channel: "telegram",
        externalMessageId: "msg-2",
        from: "user-2",
        body,
        receivedAt: new Date().toISOString(),
      },
      tenantId: "tenant-a",
      detectedLanguage: "pt",
      decision: {
        intent: "INVESTMENT_ADVISORY",
        strategy: "HYBRID",
        specialist: "investment",
        suggestedTools: ["SimulateInvestment"],
        confidence: 0.92,
        sensitivity: "normal",
        requiresHumanHandoff: false,
      },
    } as any;
  }

  it("uses the investment simulation tool for simulation requests", async () => {
    const simulateInvestmentToolService = {
      name: "SimulateInvestment",
      execute: jest.fn().mockResolvedValue({
        success: true,
        data: {
          amount: 5000,
          projectedGross: 5590,
          termMonths: 12,
        },
      }),
    };
    const specialist = new InvestmentSpecialist(
      { retrieve: jest.fn() } as any,
      {
        execute: jest.fn().mockReturnValue([
          { name: "CDB Liquidez Diaria", benchmark: "102% CDI" },
        ]),
      } as any,
      simulateInvestmentToolService as any,
    );

    const result = await specialist.execute(buildContext("Quero investir 5 mil em CDB"));

    expect(simulateInvestmentToolService.execute).toHaveBeenCalled();
    expect(result.usedRag).toBe(false);
    expect(result.toolCalls).toEqual(["SimulateInvestment"]);
  });

  it("returns a controlled message when the investment simulation tool fails", async () => {
    const specialist = new InvestmentSpecialist(
      { retrieve: jest.fn() } as any,
      {
        execute: jest.fn().mockReturnValue([
          { name: "CDB Liquidez Diaria", benchmark: "102% CDI" },
        ]),
      } as any,
      {
        name: "SimulateInvestment",
        execute: jest.fn().mockResolvedValue({
          success: false,
          error: "http_503",
        }),
      } as any,
    );

    const result = await specialist.execute(buildContext("Quero investir 5 mil em CDB"));

    expect(result.responseText).toContain("Nao consegui simular");
    expect(result.toolCalls).toEqual(["SimulateInvestment"]);
  });

  it("uses RAG for investment questions without simulation amount", async () => {
    const ragSupportService = {
      retrieve: jest.fn().mockResolvedValue({
        retrievedDocuments: [{ id: 1, source: "policy", content: "rules", createdAt: "2026-01-01" }],
        ragContext: "investment rules context",
      }),
    };
    const specialist = new InvestmentSpecialist(
      ragSupportService as any,
      {
        execute: jest.fn().mockReturnValue([
          { name: "CDB Liquidez Diaria", risk: "baixo", benchmark: "102% CDI" },
        ]),
      } as any,
      { name: "SimulateInvestment", execute: jest.fn() } as any,
    );

    const result = await specialist.execute(buildContext("Quais sao as regras para investir em CDB?"));

    expect(ragSupportService.retrieve).toHaveBeenCalled();
    expect(result.usedRag).toBe(true);
    expect(result.llmContext).toBe("investment rules context");
    expect(result.toolCalls).toEqual(["GetInvestmentProducts"]);
  });
});
