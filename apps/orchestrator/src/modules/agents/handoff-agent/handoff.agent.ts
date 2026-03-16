import { Injectable } from "@nestjs/common";
import { ChannelMessageEvent } from "@rag-platform/contracts";
import { AppLoggerService } from "@rag-platform/observability";
import { EXECUTE_HANDOFF_JOB } from "../../queue/queue.constants";
import { FlowExecutionPayload } from "../../queue/flow-execution.types";
import { FlowExecutionRequest } from "../document-agent/document.agent";
import { AgentDecision } from "../supervisor/supervisor.agent";

@Injectable()
export class HandoffAgent {
  constructor(private readonly logger: AppLoggerService) {}

  async plan(
    message: ChannelMessageEvent,
    decision: AgentDecision,
  ): Promise<FlowExecutionRequest> {
    this.logger.log("Handoff agent selected", HandoffAgent.name, {
      externalMessageId: message.externalMessageId,
      channel: message.channel,
    });

    const payload: FlowExecutionPayload = {
      channel: message.channel,
      externalMessageId: message.externalMessageId,
      context: {
        decision,
        detectedLanguage: decision.detectedLanguage,
        language: decision.detectedLanguage,
        languageConfidence: decision.languageConfidence,
        languageUsedFallback: decision.languageUsedFallback,
        handoffMessage: buildHandoffMessage(decision.detectedLanguage),
        from: message.from,
        subject: message.subject,
        body: message.body,
        metadata: message.metadata ?? {},
        conversationId: message.conversationId,
        receivedAt: message.receivedAt,
      },
    };

    return {
      jobName: EXECUTE_HANDOFF_JOB,
      payload,
    };
  }
}

function buildHandoffMessage(language: "pt" | "en" | "es"): string {
  switch (language) {
    case "en":
      return "A human agent handoff was requested.";
    case "es":
      return "Se solicito la transferencia a un agente humano.";
    case "pt":
    default:
      return "Foi solicitada a transferencia para um agente humano.";
  }
}
