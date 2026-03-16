import { Injectable } from "@nestjs/common";
import { ChannelMessageEvent } from "@rag-platform/contracts";
import { AppLoggerService } from "@rag-platform/observability";
import { EXECUTE_REGISTER_DOCUMENT_JOB } from "../../queue/queue.constants";
import { FlowExecutionPayload } from "../../queue/flow-execution.types";
import { AgentDecision } from "../supervisor/supervisor.agent";

export interface FlowExecutionRequest {
  jobName: string;
  payload: FlowExecutionPayload;
}

@Injectable()
export class DocumentAgent {
  constructor(private readonly logger: AppLoggerService) {}

  async plan(
    message: ChannelMessageEvent,
    decision: AgentDecision,
  ): Promise<FlowExecutionRequest> {
    this.logger.log("Document agent selected", DocumentAgent.name, {
      externalMessageId: message.externalMessageId,
      channel: message.channel,
    });

    return {
      jobName: EXECUTE_REGISTER_DOCUMENT_JOB,
      payload: {
        channel: message.channel,
        externalMessageId: message.externalMessageId,
        context: {
          decision,
          messageType: message.messageType ?? "document",
          detectedLanguage: decision.detectedLanguage,
          language: decision.detectedLanguage,
          languageConfidence: decision.languageConfidence,
          languageUsedFallback: decision.languageUsedFallback,
          from: message.from,
          userId: message.userId,
          chatId: message.chatId,
          messageId: message.messageId,
          text: message.text,
          document: message.document,
          subject: message.subject,
          body: message.body,
          attachments: message.attachments ?? [],
          metadata: message.metadata ?? {},
          conversationId: message.conversationId,
          receivedAt: message.receivedAt,
        },
      },
    };
  }
}
