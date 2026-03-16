import { Module } from "@nestjs/common";
import { LoggerModule } from "@rag-platform/observability";
import { AgentsModule } from "../agents/agents.module";
import { InternalApiModule } from "../internal-api/internal-api.module";
import { InboundMessageOrchestrator } from "./inbound-message.orchestrator";

@Module({
  imports: [LoggerModule, AgentsModule, InternalApiModule],
  providers: [InboundMessageOrchestrator],
  exports: [InboundMessageOrchestrator, AgentsModule],
})
export class OrchestrationModule {}
