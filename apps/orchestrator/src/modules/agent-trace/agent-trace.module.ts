import { Module } from "@nestjs/common";
import { LoggerModule } from "@rag-platform/observability";
import { AgentTracePublisherService } from "./agent-trace.publisher";

@Module({
  imports: [LoggerModule],
  providers: [AgentTracePublisherService],
  exports: [AgentTracePublisherService],
})
export class AgentTraceModule {}
