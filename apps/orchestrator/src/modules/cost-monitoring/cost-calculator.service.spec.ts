import { CostCalculatorService } from "./cost-calculator.service";

describe("CostCalculatorService", () => {
  let service: CostCalculatorService;

  beforeEach(() => {
    service = new CostCalculatorService();
  });

  it("calculates known model pricing deterministically", () => {
    expect(service.calculateCost("gpt-4o-mini", 1000)).toBe(0.0006);
  });

  it("falls back to the default pricing for unknown models", () => {
    expect(service.calculateCost("custom-model", 1000)).toBe(0.0006);
  });
});
