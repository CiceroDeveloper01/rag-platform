import { Injectable } from "@nestjs/common";
import { ChannelMessageEvent } from "@rag-platform/contracts";
import { AppLoggerService } from "@rag-platform/observability";
import { z } from "zod";
import { hasAnyBankingRoutingKeyword } from "../../decision-layer/banking-routing-keywords";
import { BankingConversationStateService } from "../../orchestrator/account-manager/banking-conversation-state.service";
import { LanguageDetectionService } from "../language-detection.service";

const targetAgentSchema = z.enum([
  "document-agent",
  "conversation-agent",
  "handoff-agent",
  "account-manager-agent",
]);

const agentDecisionSchema = z.object({
  intent: z.string().min(1),
  confidence: z.number().min(0).max(1),
  targetAgent: targetAgentSchema,
  detectedLanguage: z.enum(["pt", "en", "es"]),
  languageConfidence: z.number().min(0).max(1),
  languageUsedFallback: z.boolean(),
});

export type TargetAgent = z.infer<typeof targetAgentSchema>;
export type AgentDecision = z.infer<typeof agentDecisionSchema>;

@Injectable()
export class SupervisorAgent {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly languageDetectionService: LanguageDetectionService,
    private readonly bankingConversationStateService: BankingConversationStateService,
  ) {}

  async decide(message: ChannelMessageEvent): Promise<AgentDecision> {
    const attachmentCount = message.attachments?.length ?? 0;
    const messageType =
      message.messageType ?? inferMessageType(message, attachmentCount);
    const normalizedText = [
      message.subject ?? "",
      message.body,
      JSON.stringify(message.metadata ?? {}),
    ]
      .join(" ")
      .toLowerCase();

    const language = this.languageDetectionService.detect(normalizedText);
    const pendingConfirmation =
      await this.bankingConversationStateService.getPendingConfirmationState(
        message,
      );
    const decision = this.buildDecision(
      messageType,
      normalizedText,
      attachmentCount,
      language,
      pendingConfirmation,
    );

    this.logger.debug("Supervisor decision produced", SupervisorAgent.name, {
      externalMessageId: message.externalMessageId,
      targetAgent: decision.targetAgent,
      confidence: decision.confidence,
      intent: decision.intent,
      detectedLanguage: decision.detectedLanguage,
      languageConfidence: decision.languageConfidence,
    });

    return decision;
  }

  private buildDecision(
    messageType: "text" | "document" | "command",
    normalizedText: string,
    attachmentCount: number,
    language: {
      detectedLanguage: "pt" | "en" | "es";
      confidence: number;
      usedFallback: boolean;
    },
    pendingConfirmation: { confirmationPending: boolean } | null,
  ): AgentDecision {
    if (messageType === "document") {
      return agentDecisionSchema.parse({
        intent: "register-document",
        confidence: attachmentCount > 0 ? 0.98 : 0.9,
        targetAgent: "document-agent",
        detectedLanguage: language.detectedLanguage,
        languageConfidence: language.confidence,
        languageUsedFallback: language.usedFallback,
      });
    }

    if (
      normalizedText.includes("anexo") ||
      normalizedText.includes("arquivo") ||
      normalizedText.includes("documento") ||
      normalizedText.includes("pdf")
    ) {
      return agentDecisionSchema.parse({
        intent: "register-document",
        confidence: attachmentCount > 0 ? 0.96 : 0.83,
        targetAgent: "document-agent",
        detectedLanguage: language.detectedLanguage,
        languageConfidence: language.confidence,
        languageUsedFallback: language.usedFallback,
      });
    }

    if (pendingConfirmation?.confirmationPending) {
      return agentDecisionSchema.parse({
        intent: "account-manager-pending-confirmation",
        confidence: 0.98,
        targetAgent: "account-manager-agent",
        detectedLanguage: language.detectedLanguage,
        languageConfidence: language.confidence,
        languageUsedFallback: language.usedFallback,
      });
    }

    if (
      normalizedText.includes("humano") ||
      normalizedText.includes("atendente") ||
      normalizedText.includes("suporte") ||
      normalizedText.includes("urgente") ||
      normalizedText.includes("reclama")
    ) {
      return agentDecisionSchema.parse({
        intent: "handoff",
        confidence: 0.81,
        targetAgent: "handoff-agent",
        detectedLanguage: language.detectedLanguage,
        languageConfidence: language.confidence,
        languageUsedFallback: language.usedFallback,
      });
    }

    if (hasAnyBankingRoutingKeyword(normalizedText)) {
      return agentDecisionSchema.parse({
        intent: "account-manager",
        confidence: 0.87,
        targetAgent: "account-manager-agent",
        detectedLanguage: language.detectedLanguage,
        languageConfidence: language.confidence,
        languageUsedFallback: language.usedFallback,
      });
    }

    return agentDecisionSchema.parse({
      intent: "reply-conversation",
      confidence: 0.74,
      targetAgent: "conversation-agent",
      detectedLanguage: language.detectedLanguage,
      languageConfidence: language.confidence,
      languageUsedFallback: language.usedFallback,
    });
  }
}

function inferMessageType(
  message: ChannelMessageEvent,
  attachmentCount: number,
): "text" | "document" | "command" {
  if (message.messageType) {
    return message.messageType;
  }

  if (attachmentCount > 0 || message.document) {
    return "document";
  }

  if ((message.text ?? message.body).trim().startsWith("/")) {
    return "command";
  }

  return "text";
}
