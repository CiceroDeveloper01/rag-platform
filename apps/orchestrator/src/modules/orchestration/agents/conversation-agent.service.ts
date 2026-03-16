import { Injectable, Logger } from "@nestjs/common";
import { ConversationsInternalClient } from "@rag-platform/sdk";
import { InboundMessagePayload } from "../../queue/inbound-message.types";
import { SupervisorDecision } from "../supervisor/supervisor.types";

@Injectable()
export class ConversationAgentService {
  private readonly logger = new Logger(ConversationAgentService.name);

  constructor(
    private readonly conversationsClient: ConversationsInternalClient,
  ) {}

  async handle(
    inboundMessage: InboundMessagePayload,
    decision: SupervisorDecision,
  ): Promise<unknown> {
    this.logger.log(
      `Conversation agent handling ${inboundMessage.externalMessageId}`,
    );

    return this.conversationsClient.reply({
      tenantId:
        typeof inboundMessage.metadata?.tenantId === "string"
          ? inboundMessage.metadata.tenantId
          : "default-tenant",
      channel: inboundMessage.channel,
      externalMessageId: inboundMessage.externalMessageId,
      message: inboundMessage.body,
      metadata: {
        ...inboundMessage.metadata,
        supervisorReason: decision.reason,
      },
    });
  }
}
