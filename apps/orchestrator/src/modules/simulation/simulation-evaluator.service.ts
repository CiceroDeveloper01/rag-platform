import { Injectable } from "@nestjs/common";

export interface SimulationEvaluationResult {
  actualAgent: string;
  actualAction: string;
  score: "PASS" | "FAIL";
}

@Injectable()
export class SimulationEvaluatorService {
  evaluate(
    expectedAgent: string,
    expectedAction: string,
    actualAgent: string,
    actualAction: string,
  ): SimulationEvaluationResult {
    return {
      actualAgent,
      actualAction,
      score:
        expectedAgent === actualAgent && expectedAction === actualAction
          ? "PASS"
          : "FAIL",
    };
  }
}
