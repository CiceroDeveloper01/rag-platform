import { Injectable, Logger } from "@nestjs/common";
import { DocumentsInternalClient } from "@rag-platform/sdk";
import { InboundMessagePayload } from "../../queue/inbound-message.types";
import { SupervisorDecision } from "../supervisor/supervisor.types";

@Injectable()
export class DocumentAgentService {
  private readonly logger = new Logger(DocumentAgentService.name);

  constructor(private readonly documentsClient: DocumentsInternalClient) {}

  async handle(
    inboundMessage: InboundMessagePayload,
    decision: SupervisorDecision,
  ): Promise<unknown> {
    this.logger.log(
      `Document agent handling ${inboundMessage.externalMessageId}`,
    );

    return this.documentsClient.registerDocument({
      tenantId:
        typeof inboundMessage.metadata?.tenantId === "string"
          ? inboundMessage.metadata.tenantId
          : "default-tenant",
      source: inboundMessage.channel.toLowerCase(),
      content: inboundMessage.body,
      externalMessageId: inboundMessage.externalMessageId,
      metadata: {
        ...inboundMessage.metadata,
        supervisorReason: decision.reason,
      },
    });
  }
}
