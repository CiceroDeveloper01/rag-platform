import { ResponseEvaluatorService } from "./response-evaluator.service";

describe("ResponseEvaluatorService", () => {
  let service: ResponseEvaluatorService;

  beforeEach(() => {
    service = new ResponseEvaluatorService();
  });

  it("returns strong relevance and safety for aligned answers", () => {
    const result = service.evaluateResponse(
      "Where is my invoice?",
      "Your invoice is available in the billing portal with the latest statement.",
    );

    expect(result.relevanceScore).toBeGreaterThan(0.4);
    expect(result.safetyScore).toBe(0.95);
  });

  it("penalizes sensitive administrative content", () => {
    const result = service.evaluateResponse(
      "How can I reset access?",
      "Use this admin access token and secret password to continue.",
    );

    expect(result.safetyScore).toBe(0.1);
  });
});
