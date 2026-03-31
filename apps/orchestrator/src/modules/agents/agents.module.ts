import { Module } from "@nestjs/common";
import { LoggerModule, MetricsService } from "@rag-platform/observability";
import { MemoryModule } from "../memory/memory.module";
import { RagModule } from "../rag/rag.module";
import { GuardrailsModule } from "../guardrails/guardrails.module";
import { ToolsModule } from "../tools/tools.module";
import { DecisionService } from "../decision-layer/decision.service";
import { ResponseComposerService } from "../response/response-composer.service";
import { BankingConversationStateService } from "../orchestrator/account-manager/banking-conversation-state.service";
import { AccountSpecialist } from "../specialists/account/account.specialist";
import { CardSpecialist } from "../specialists/card/card.specialist";
import { CreditSpecialist } from "../specialists/credit/credit.specialist";
import { DebtSpecialist } from "../specialists/debt/debt.specialist";
import { FaqSpecialist } from "../specialists/faq/faq.specialist";
import { InvestmentSpecialist } from "../specialists/investment/investment.specialist";
import { RagSupportService } from "../specialists/shared/rag-support.service";
import { AccountManagerOrchestrator } from "../orchestrator/account-manager/account-manager.orchestrator";
import { AgentGraphService } from "./agent.graph";
import { AccountManagerAgent } from "./account-manager-agent/account-manager.agent";
import { ConversationAgent } from "./conversation-agent/conversation.agent";
import { DocumentAgent } from "./document-agent/document.agent";
import { HandoffAgent } from "./handoff-agent/handoff.agent";
import { LanguageDetectionService } from "./language-detection.service";
import { SupervisorAgent } from "./supervisor/supervisor.agent";

@Module({
  imports: [LoggerModule, RagModule, MemoryModule, ToolsModule, GuardrailsModule],
  providers: [
    MetricsService,
    LanguageDetectionService,
    DecisionService,
    ResponseComposerService,
    RagSupportService,
    AccountSpecialist,
    CardSpecialist,
    CreditSpecialist,
    DebtSpecialist,
    FaqSpecialist,
    InvestmentSpecialist,
    BankingConversationStateService,
    AccountManagerOrchestrator,
    AccountManagerAgent,
    SupervisorAgent,
    DocumentAgent,
    ConversationAgent,
    HandoffAgent,
    AgentGraphService,
  ],
  exports: [AgentGraphService, MetricsService, LanguageDetectionService],
})
export class AgentsModule {}
