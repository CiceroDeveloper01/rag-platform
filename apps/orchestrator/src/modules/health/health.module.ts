import { Module } from "@nestjs/common";
import { OrchestratorHealthService } from "./orchestrator-health.service";

@Module({
  providers: [OrchestratorHealthService],
  exports: [OrchestratorHealthService],
})
export class HealthModule {}
