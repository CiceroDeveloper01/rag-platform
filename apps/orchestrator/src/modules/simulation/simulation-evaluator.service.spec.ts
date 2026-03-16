import { SimulationEvaluatorService } from "./simulation-evaluator.service";

describe("SimulationEvaluatorService", () => {
  let service: SimulationEvaluatorService;

  beforeEach(() => {
    service = new SimulationEvaluatorService();
  });

  it("returns PASS when the agent and action match the expectation", () => {
    expect(
      service.evaluate(
        "conversation-agent",
        "execute.reply-conversation",
        "conversation-agent",
        "execute.reply-conversation",
      ),
    ).toMatchObject({
      score: "PASS",
    });
  });

  it("returns FAIL when the execution diverges from the scenario", () => {
    expect(
      service.evaluate(
        "conversation-agent",
        "execute.reply-conversation",
        "handoff-agent",
        "execute.handoff",
      ),
    ).toMatchObject({
      score: "FAIL",
      actualAgent: "handoff-agent",
      actualAction: "execute.handoff",
    });
  });
});
