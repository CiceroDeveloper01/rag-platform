import { Injectable, Logger } from "@nestjs/common";
import { InboundMessagePayload } from "../queue/inbound-message.types";
import { ConversationAgentService } from "./agents/conversation-agent.service";
import { DocumentAgentService } from "./agents/document-agent.service";
import { HandoffAgentService } from "./agents/handoff-agent.service";
import { SupervisorAgentService } from "./supervisor/supervisor.agent";

@Injectable()
export class OrchestratorRuntimeService {
  private readonly logger = new Logger(OrchestratorRuntimeService.name);

  constructor(
    private readonly supervisorAgentService: SupervisorAgentService,
    private readonly documentAgentService: DocumentAgentService,
    private readonly conversationAgentService: ConversationAgentService,
    private readonly handoffAgentService: HandoffAgentService,
  ) {}

  async handleMessage(inboundMessage: InboundMessagePayload): Promise<unknown> {
    this.logger.log(
      `Processing inbound message ${inboundMessage.externalMessageId} from ${inboundMessage.channel}`,
    );

    const decision = await this.supervisorAgentService.decide(inboundMessage);

    switch (decision.route) {
      case "document-agent":
        return this.documentAgentService.handle(inboundMessage, decision);
      case "handoff-agent":
        return this.handoffAgentService.handle(inboundMessage, decision);
      case "conversation-agent":
      default:
        return this.conversationAgentService.handle(inboundMessage, decision);
    }
  }
}
