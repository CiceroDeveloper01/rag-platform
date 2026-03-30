import { Injectable } from "@nestjs/common";
import { ChannelMessageEvent } from "@rag-platform/contracts";
import { AppLoggerService } from "@rag-platform/observability";
import { AccountManagerOrchestrator } from "../../orchestrator/account-manager/account-manager.orchestrator";
import {
  EXECUTE_HANDOFF_JOB,
  EXECUTE_REPLY_CONVERSATION_JOB,
} from "../../queue/queue.constants";
import { FlowExecutionPayload } from "../../queue/flow-execution.types";
import { FlowExecutionRequest } from "../document-agent/document.agent";
import { HandoffAgent } from "../handoff-agent/handoff.agent";
import { AgentDecision } from "../supervisor/supervisor.agent";

@Injectable()
export class AccountManagerAgent {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly accountManagerOrchestrator: AccountManagerOrchestrator,
    private readonly handoffAgent: HandoffAgent,
  ) {}

  async plan(
    message: ChannelMessageEvent,
    decision: AgentDecision,
  ): Promise<FlowExecutionRequest> {
    const orchestration = await this.accountManagerOrchestrator.execute({
      message,
      detectedLanguage: decision.detectedLanguage,
    });

    this.logger.log("Account manager agent selected", AccountManagerAgent.name, {
      externalMessageId: message.externalMessageId,
      intent: orchestration.decision.intent,
      specialist: orchestration.decision.specialist,
    });

    if (orchestration.handoffRequested) {
      const handoffRequest = await this.handoffAgent.plan(message, {
        ...decision,
        intent: "handoff",
        targetAgent: "handoff-agent",
      });

      return {
        jobName: EXECUTE_HANDOFF_JOB,
        payload: {
          ...handoffRequest.payload,
          context: {
            ...(handoffRequest.payload.context ?? {}),
            handoffMessage: orchestration.responseText,
            metadata: {
              ...(message.metadata ?? {}),
              ...(handoffRequest.payload.context?.metadata as
                | Record<string, unknown>
                | undefined),
              ...orchestration.responseMetadata,
            },
          },
        },
      };
    }

    const payload: FlowExecutionPayload = {
      channel: message.channel,
      externalMessageId: message.externalMessageId,
      context: {
        decision: {
          ...decision,
          bankingIntent: orchestration.decision.intent,
          bankingSpecialist: orchestration.decision.specialist,
        },
        from: message.from,
        subject: message.subject,
        body: message.body,
        conversationId: message.conversationId ?? message.externalMessageId,
        detectedLanguage: decision.detectedLanguage,
        language: decision.detectedLanguage,
        languageConfidence: decision.languageConfidence,
        languageUsedFallback: decision.languageUsedFallback,
        responseText: orchestration.responseText,
        llmContext: orchestration.aiUsage.usedLlm
          ? orchestration.llmContext
          : undefined,
        aiUsage: orchestration.aiUsage,
        retrievedDocuments: orchestration.retrievedDocuments,
        toolCalls: orchestration.toolCalls,
        metadata: {
          ...(message.metadata ?? {}),
          ...orchestration.responseMetadata,
        },
        receivedAt: message.receivedAt,
      },
    };

    return {
      jobName: EXECUTE_REPLY_CONVERSATION_JOB,
      payload,
    };
  }
}
