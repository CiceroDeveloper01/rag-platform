import { ResponseComposerService } from "./response-composer.service";

describe("ResponseComposerService", () => {
  const service = new ResponseComposerService();

  it("masks sensitive identifiers without corrupting financial amounts", () => {
    const result = service.compose({
      decision: {
        intent: "CARD_SERVICES",
        strategy: "TOOL",
        specialist: "card",
        suggestedTools: ["GetCards"],
        confidence: 0.9,
        sensitivity: "normal",
        requiresHumanHandoff: false,
      },
      specialistResult: {
        responseText:
          "cartao 4111111111111111, conta 12345678, cpf 12345678901, limite de R$ 18000.00 e fatura de R$ 1280.44.",
        usedRag: false,
        retrievedDocuments: [],
        toolCalls: ["GetCards"],
      },
    });

    expect(result.responseText).toContain("cartao ************1111");
    expect(result.responseText).toContain("conta ****5678");
    expect(result.responseText).toContain("cpf *******8901");
    expect(result.responseText).toContain("R$ 18000.00");
    expect(result.responseText).toContain("R$ 1280.44");
  });
});
