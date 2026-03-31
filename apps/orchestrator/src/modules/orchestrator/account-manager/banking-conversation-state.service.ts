import { Injectable } from "@nestjs/common";
import { ChannelMessageEvent } from "@rag-platform/contracts";
import { DecisionResult, SpecialistName } from "../../decision-layer/decision.types";
import { ConversationMemoryService } from "../../memory/conversation-memory.service";
import { DocumentIndexerService } from "../../rag/document-indexer.service";

export interface PendingBankingState {
  type: "banking_state";
  confirmationPending: boolean;
  intent: DecisionResult["intent"];
  specialist: SpecialistName;
  operation: string;
}

@Injectable()
export class BankingConversationStateService {
  constructor(
    private readonly conversationMemoryService: ConversationMemoryService,
    private readonly documentIndexerService: DocumentIndexerService,
  ) {}

  async getPendingConfirmationState(
    message: ChannelMessageEvent,
  ): Promise<PendingBankingState | null> {
    const context = await this.conversationMemoryService.getConversationContext({
      tenantId: resolveTenantId(message),
      channel: String(message.channel),
      conversationId: resolveConversationId(message),
      queryEmbedding: this.documentIndexerService.createQueryEmbedding(
        message.body,
      ),
    });

    const latestState = [...context.recentMessages]
      .reverse()
      .find((memory) => isBankingState(memory.metadata));

    const metadata = latestState?.metadata;
    if (!isBankingState(metadata)) {
      return null;
    }

    return metadata.confirmationPending ? metadata : null;
  }

  async storePendingConfirmation(params: {
    message: ChannelMessageEvent;
    decision: DecisionResult;
    operation: string;
  }): Promise<void> {
    if (!params.decision.specialist) {
      return;
    }

    await this.conversationMemoryService.storeMessage({
      tenantId: resolveTenantId(params.message),
      channel: String(params.message.channel),
      conversationId: resolveConversationId(params.message),
      role: "system",
      message: "banking_confirmation_pending",
      metadata: {
        type: "banking_state",
        confirmationPending: true,
        intent: params.decision.intent,
        specialist: params.decision.specialist,
        operation: params.operation,
      },
    });
  }

  async clearPendingConfirmation(message: ChannelMessageEvent): Promise<void> {
    await this.conversationMemoryService.storeMessage({
      tenantId: resolveTenantId(message),
      channel: String(message.channel),
      conversationId: resolveConversationId(message),
      role: "system",
      message: "banking_confirmation_resolved",
      metadata: {
        type: "banking_state",
        confirmationPending: false,
        intent: "UNKNOWN",
        specialist: "faq",
        operation: "none",
      },
    });
  }
}

function isBankingState(metadata: unknown): metadata is PendingBankingState {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    (metadata as Record<string, unknown>).type === "banking_state" &&
    typeof (metadata as Record<string, unknown>).confirmationPending ===
      "boolean" &&
    typeof (metadata as Record<string, unknown>).intent === "string" &&
    typeof (metadata as Record<string, unknown>).specialist === "string" &&
    typeof (metadata as Record<string, unknown>).operation === "string"
  );
}

function resolveTenantId(message: ChannelMessageEvent): string {
  return typeof message.metadata?.tenantId === "string"
    ? message.metadata.tenantId
    : "default-tenant";
}

function resolveConversationId(message: ChannelMessageEvent): string {
  return message.conversationId ?? message.externalMessageId;
}
