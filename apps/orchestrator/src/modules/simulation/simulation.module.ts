import { Module } from "@nestjs/common";
import { LoggerModule } from "@rag-platform/observability";
import { AgentsModule } from "../agents/agents.module";
import { AgentSimulatorService } from "./agent-simulator.service";
import { ScenarioRunnerService } from "./scenario-runner.service";
import { SimulationEvaluatorService } from "./simulation-evaluator.service";

@Module({
  imports: [LoggerModule, AgentsModule],
  providers: [
    AgentSimulatorService,
    SimulationEvaluatorService,
    ScenarioRunnerService,
  ],
  exports: [ScenarioRunnerService],
})
export class SimulationModule {}
