import { Module } from "@nestjs/common";
import { LoggerModule, MetricsService } from "@rag-platform/observability";
import { MemoryModule } from "../memory/memory.module";
import { RagModule } from "../rag/rag.module";
import { ToolsModule } from "../tools/tools.module";
import { AgentGraphService } from "./agent.graph";
import { ConversationAgent } from "./conversation-agent/conversation.agent";
import { DocumentAgent } from "./document-agent/document.agent";
import { HandoffAgent } from "./handoff-agent/handoff.agent";
import { LanguageDetectionService } from "./language-detection.service";
import { SupervisorAgent } from "./supervisor/supervisor.agent";

@Module({
  imports: [LoggerModule, RagModule, MemoryModule, ToolsModule],
  providers: [
    MetricsService,
    LanguageDetectionService,
    SupervisorAgent,
    DocumentAgent,
    ConversationAgent,
    HandoffAgent,
    AgentGraphService,
  ],
  exports: [AgentGraphService, MetricsService, LanguageDetectionService],
})
export class AgentsModule {}
