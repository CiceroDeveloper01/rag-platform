import { Injectable, Logger } from "@nestjs/common";
import { HandoffInternalClient } from "@rag-platform/sdk";
import { InboundMessagePayload } from "../../queue/inbound-message.types";
import { SupervisorDecision } from "../supervisor/supervisor.types";

@Injectable()
export class HandoffAgentService {
  private readonly logger = new Logger(HandoffAgentService.name);

  constructor(private readonly handoffClient: HandoffInternalClient) {}

  async handle(
    inboundMessage: InboundMessagePayload,
    decision: SupervisorDecision,
  ): Promise<unknown> {
    this.logger.log(
      `Handoff agent handling ${inboundMessage.externalMessageId}`,
    );

    return this.handoffClient.createHandoff({
      channel: inboundMessage.channel,
      externalMessageId: inboundMessage.externalMessageId,
      reason: decision.reason,
      metadata: inboundMessage.metadata,
    });
  }
}
