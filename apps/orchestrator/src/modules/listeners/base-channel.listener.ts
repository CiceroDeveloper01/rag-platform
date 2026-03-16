import { Logger } from "@nestjs/common";
import { InboundMessagesQueueService } from "../queue/inbound-messages.queue";
import { InboundMessagePayload } from "../queue/inbound-message.types";

export abstract class BaseChannelListener {
  protected readonly logger: Logger;

  protected constructor(
    context: string,
    protected readonly inboundMessagesQueueService: InboundMessagesQueueService,
  ) {
    this.logger = new Logger(context);
  }

  abstract start(): Promise<void>;

  protected async publishInboundMessage(
    payload: InboundMessagePayload,
  ): Promise<void> {
    await this.inboundMessagesQueueService.enqueueReceivedMessage(payload);
  }
}
