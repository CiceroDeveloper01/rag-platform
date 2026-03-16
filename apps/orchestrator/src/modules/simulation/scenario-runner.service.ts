import { Injectable } from "@nestjs/common";
import { AppLoggerService } from "@rag-platform/observability";
import {
  AgentSimulatorService,
  SimulationScenarioDefinition,
} from "./agent-simulator.service";
import { SimulationEvaluatorService } from "./simulation-evaluator.service";

export interface SimulationResultRecord {
  scenarioId: string;
  scenarioName: string;
  actualAgent: string;
  actualAction: string;
  score: "PASS" | "FAIL";
  createdAt: string;
}

@Injectable()
export class ScenarioRunnerService {
  private readonly scenarios: SimulationScenarioDefinition[] = [
    {
      scenarioName: "conversation-default",
      inputMessage: "Como eu acompanho minha fatura?",
      expectedAgent: "conversation-agent",
      expectedAction: "execute.reply-conversation",
    },
    {
      scenarioName: "document-upload",
      inputMessage: "Estou enviando o PDF da proposta em anexo.",
      expectedAgent: "document-agent",
      expectedAction: "execute.register-document",
    },
  ];

  private readonly results: SimulationResultRecord[] = [];

  constructor(
    private readonly logger: AppLoggerService,
    private readonly agentSimulatorService: AgentSimulatorService,
    private readonly simulationEvaluatorService: SimulationEvaluatorService,
  ) {}

  listScenarios(): SimulationScenarioDefinition[] {
    return [...this.scenarios];
  }

  listResults(): SimulationResultRecord[] {
    return [...this.results];
  }

  async runScenario(scenario: SimulationScenarioDefinition) {
    const execution = await this.agentSimulatorService.simulate(scenario);
    const evaluation = this.simulationEvaluatorService.evaluate(
      scenario.expectedAgent,
      scenario.expectedAction,
      execution.decision.targetAgent,
      execution.executionRequest.jobName,
    );

    const result: SimulationResultRecord = {
      scenarioId: scenario.scenarioName,
      scenarioName: scenario.scenarioName,
      actualAgent: evaluation.actualAgent,
      actualAction: evaluation.actualAction,
      score: evaluation.score,
      createdAt: new Date().toISOString(),
    };

    this.results.unshift(result);
    this.results.splice(100);

    this.logger.log(
      "Simulation scenario executed",
      ScenarioRunnerService.name,
      {
        scenarioName: scenario.scenarioName,
        score: result.score,
      },
    );

    return result;
  }
}
