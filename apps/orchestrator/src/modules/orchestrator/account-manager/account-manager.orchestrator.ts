import { Injectable } from "@nestjs/common";
import { ChannelMessageEvent } from "@rag-platform/contracts";
import {
  AppLoggerService,
  MetricsService,
  ACCOUNT_MANAGER_HANDOFF_TOTAL,
  ACCOUNT_MANAGER_INTENT_TOTAL,
  ACCOUNT_MANAGER_RAG_USAGE_TOTAL,
  ACCOUNT_MANAGER_SPECIALIST_TOTAL,
  ACCOUNT_MANAGER_TOOL_USAGE_TOTAL,
} from "@rag-platform/observability";
import { DecisionService } from "../../decision-layer/decision.service";
import { DecisionResult } from "../../decision-layer/decision.types";
import { BankingGuardrailService } from "../../guardrails/banking-guardrail.service";
import { ResponseComposerService } from "../../response/response-composer.service";
import { DocumentIndexerService } from "../../rag/document-indexer.service";
import { AccountSpecialist } from "../../specialists/account/account.specialist";
import { CardSpecialist } from "../../specialists/card/card.specialist";
import { CreditSpecialist } from "../../specialists/credit/credit.specialist";
import { DebtSpecialist } from "../../specialists/debt/debt.specialist";
import { FaqSpecialist } from "../../specialists/faq/faq.specialist";
import { InvestmentSpecialist } from "../../specialists/investment/investment.specialist";
import { SpecialistResult } from "../../specialists/specialist.types";
import {
  BankingConversationStateService,
  PendingBankingState,
} from "./banking-conversation-state.service";

@Injectable()
export class AccountManagerOrchestrator {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly metricsService: MetricsService,
    private readonly decisionService: DecisionService,
    private readonly bankingGuardrailService: BankingGuardrailService,
    private readonly bankingConversationStateService: BankingConversationStateService,
    private readonly documentIndexerService: DocumentIndexerService,
    private readonly responseComposerService: ResponseComposerService,
    private readonly accountSpecialist: AccountSpecialist,
    private readonly cardSpecialist: CardSpecialist,
    private readonly creditSpecialist: CreditSpecialist,
    private readonly investmentSpecialist: InvestmentSpecialist,
    private readonly debtSpecialist: DebtSpecialist,
    private readonly faqSpecialist: FaqSpecialist,
  ) {}

  async execute(payload: {
    message: ChannelMessageEvent;
    detectedLanguage: "pt" | "en" | "es";
  }): Promise<{
    decision: DecisionResult;
    responseText: string;
    llmContext?: string;
    retrievedDocuments: Array<Record<string, unknown>>;
    toolCalls: string[];
    responseMetadata: Record<string, unknown>;
    handoffRequested: boolean;
    aiUsage: {
      usedRag: boolean;
      usedLlm: boolean;
    };
  }> {
    const startedAt = Date.now();
    const pendingConfirmation =
      await this.bankingConversationStateService.getPendingConfirmationState(
        payload.message,
      );
    const decision = pendingConfirmation
      ? buildDecisionFromPendingState(pendingConfirmation)
      : this.decisionService.classify(payload.message.body);
    const tenantId =
      typeof payload.message.metadata?.tenantId === "string"
        ? payload.message.metadata.tenantId
        : "default-tenant";
    this.metricsService.increment(ACCOUNT_MANAGER_INTENT_TOTAL, {
      intent: decision.intent,
    });

    const guardrail = this.bankingGuardrailService.evaluate({
      decision,
      messageBody: payload.message.body,
      language: payload.detectedLanguage,
    });

    if (guardrail.blocked) {
      if (
        decision.sensitivity === "sensitive" &&
        !pendingConfirmation &&
        !guardrail.handoffRequested
      ) {
        await this.bankingConversationStateService.storePendingConfirmation({
          message: payload.message,
          decision,
          operation: decision.suggestedTools[0] ?? "SensitiveOperation",
        });
      }

      if (pendingConfirmation && guardrail.handoffRequested) {
        await this.bankingConversationStateService.clearPendingConfirmation(
          payload.message,
        );
      }

      if (guardrail.handoffRequested) {
        this.metricsService.increment(ACCOUNT_MANAGER_HANDOFF_TOTAL);
      }

      return {
        decision,
        responseText: guardrail.responseText ?? "Nao foi possivel continuar com a solicitacao.",
        llmContext: undefined,
        retrievedDocuments: [],
        toolCalls: [],
        responseMetadata: {
          intentDetected: decision.intent,
          specialistSelected: decision.specialist,
          usedRag: false,
          toolCalls: [],
          handoffRequested: guardrail.handoffRequested ?? false,
        },
        handoffRequested: guardrail.handoffRequested ?? false,
        aiUsage: {
          usedRag: false,
          usedLlm: false,
        },
      };
    }

    if (pendingConfirmation) {
      await this.bankingConversationStateService.clearPendingConfirmation(
        payload.message,
      );
    }

    const queryEmbedding =
      decision.strategy === "RAG" || decision.strategy === "HYBRID"
        ? this.documentIndexerService.createQueryEmbedding(payload.message.body)
        : undefined;

    const specialistResult = await this.runSpecialist(decision, {
      message: payload.message,
      tenantId,
      detectedLanguage: payload.detectedLanguage,
      decision,
      queryEmbedding,
    });
    const composed = this.responseComposerService.compose({
      decision,
      specialistResult,
    });

    this.metricsService.increment(ACCOUNT_MANAGER_SPECIALIST_TOTAL, {
      specialist: decision.specialist ?? "none",
    });
    if (specialistResult.usedRag) {
      this.metricsService.increment(ACCOUNT_MANAGER_RAG_USAGE_TOTAL);
    }
    specialistResult.toolCalls.forEach((toolCall) => {
      this.metricsService.increment(ACCOUNT_MANAGER_TOOL_USAGE_TOTAL, {
        tool: toolCall,
      });
    });
    this.metricsService.record(
      "account_manager_response_duration_ms",
      Date.now() - startedAt,
    );

    this.logger.log(
      "Account manager orchestration completed",
      AccountManagerOrchestrator.name,
      {
        externalMessageId: payload.message.externalMessageId,
        intent: decision.intent,
        specialist: decision.specialist,
        toolCalls: specialistResult.toolCalls,
      },
    );

    return {
      decision,
      responseText: composed.responseText,
      llmContext: specialistResult.llmContext,
      retrievedDocuments: specialistResult.retrievedDocuments.map((document) => ({
        id: document.id,
        source: document.source,
        content: document.content,
        createdAt: document.createdAt,
      })),
      toolCalls: specialistResult.toolCalls,
      responseMetadata: composed.responseMetadata,
      handoffRequested: specialistResult.handoffRequested ?? false,
      aiUsage: {
        usedRag: specialistResult.usedRag,
        usedLlm: specialistResult.usedLlm ?? false,
      },
    };
  }

  private runSpecialist(
    decision: DecisionResult,
    context: Parameters<AccountSpecialist["execute"]>[0],
  ): Promise<SpecialistResult> {
    switch (decision.specialist) {
      case "account":
        return this.accountSpecialist.execute(context);
      case "card":
        return this.cardSpecialist.execute(context);
      case "credit":
        return this.creditSpecialist.execute(context);
      case "investment":
        return this.investmentSpecialist.execute(context);
      case "debt":
        return this.debtSpecialist.execute(context);
      case "faq":
      default:
        return this.faqSpecialist.execute(context);
    }
  }
}

function buildDecisionFromPendingState(
  pendingState: PendingBankingState,
): DecisionResult {
  return {
    intent: pendingState.intent,
    strategy: "HYBRID",
    specialist: pendingState.specialist,
    suggestedTools: [pendingState.operation],
    confidence: 0.98,
    sensitivity: "sensitive",
    requiresHumanHandoff: false,
  };
}
