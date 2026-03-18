import { Module } from "@nestjs/common";
import { LoggerModule } from "@rag-platform/observability";
import { AgentTraceModule } from "../agent-trace/agent-trace.module";
import { AgentsModule } from "../agents/agents.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import { CostMonitoringModule } from "../cost-monitoring/cost-monitoring.module";
import { EvaluationModule } from "../evaluation/evaluation.module";
import { GuardrailsModule } from "../guardrails/guardrails.module";
import { ChannelsModule } from "../channels/channels.module";
import { InternalApiModule } from "../internal-api/internal-api.module";
import { QueueModule } from "../queue/queue.module";
import { TenancyModule } from "../tenancy/tenancy.module";
import { ToolsModule } from "../tools/tools.module";
import { FlowExecutionProcessor } from "./flow-execution.processor";
import { InboundMessageProcessor } from "./inbound-message.processor";

@Module({
  imports: [
    LoggerModule,
    AgentTraceModule,
    AnalyticsModule,
    TenancyModule,
    CostMonitoringModule,
    EvaluationModule,
    GuardrailsModule,
    AgentsModule,
    ChannelsModule,
    InternalApiModule,
    ToolsModule,
    QueueModule,
  ],
  providers: [InboundMessageProcessor, FlowExecutionProcessor],
})
export class ProcessorsModule {}
