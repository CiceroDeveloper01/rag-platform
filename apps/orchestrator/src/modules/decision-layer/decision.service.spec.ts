import { DecisionService } from "./decision.service";

describe("DecisionService", () => {
  const service = new DecisionService();

  it("classifies investment advisory journeys", () => {
    expect(service.classify("Quero investir 5 mil em CDB")).toMatchObject({
      intent: "INVESTMENT_ADVISORY",
      specialist: "investment",
      strategy: "HYBRID",
    });
  });

  it("classifies lost card requests as sensitive card services", () => {
    expect(service.classify("Perdi meu cartao e preciso bloquear agora")).toMatchObject({
      intent: "CARD_SERVICES",
      specialist: "card",
      sensitivity: "sensitive",
    });
  });
});
