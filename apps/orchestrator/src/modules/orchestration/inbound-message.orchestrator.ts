import { Injectable } from "@nestjs/common";
import { AppLoggerService } from "@rag-platform/observability";
import {
  ConversationsClient,
  DocumentsClient,
  HandoffClient,
} from "@rag-platform/sdk";
import { InboundMessagePayload } from "../queue/inbound-message.types";

@Injectable()
export class InboundMessageOrchestrator {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly documentsClient: DocumentsClient,
    private readonly conversationsClient: ConversationsClient,
    private readonly handoffClient: HandoffClient,
  ) {}

  async orchestrate(event: InboundMessagePayload): Promise<void> {
    this.logger.log(
      "Inbound message received for orchestration",
      InboundMessageOrchestrator.name,
      {
        channel: event.channel,
        externalMessageId: event.externalMessageId,
      },
    );

    void this.documentsClient;
    void this.conversationsClient;
    void this.handoffClient;

    const preparedContext = {
      channel: event.channel,
      externalMessageId: event.externalMessageId,
      receivedAt: event.receivedAt,
    };

    this.logger.debug(
      "Inbound message context prepared",
      InboundMessageOrchestrator.name,
      preparedContext,
    );
  }
}
