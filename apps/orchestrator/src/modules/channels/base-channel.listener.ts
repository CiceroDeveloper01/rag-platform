import { Channel } from "@rag-platform/contracts";
import { AppLoggerService } from "@rag-platform/observability";
import { ChannelListener } from "./channel-listener.interface";
import { InboundMessagesQueueService } from "../queue/inbound-messages.queue";
import { InboundMessagePayload } from "../queue/inbound-message.types";

export abstract class BaseChannelListener implements ChannelListener {
  abstract readonly channel: Channel;

  protected constructor(
    protected readonly logger: AppLoggerService,
    protected readonly inboundMessagesQueueService: InboundMessagesQueueService,
    private readonly context: string,
  ) {}

  abstract start(): Promise<void>;

  protected async publishInboundMessage(
    payload: InboundMessagePayload,
  ): Promise<void> {
    this.logger.log("Publishing inbound channel event", this.context, {
      channel: payload.channel,
      externalMessageId: payload.externalMessageId,
    });
    await this.inboundMessagesQueueService.enqueueReceivedMessage(payload);
  }

  protected logReady(metadata?: Record<string, unknown>): void {
    this.logger.log("Channel listener ready", this.context, {
      channel: this.channel,
      ...metadata,
    });
  }

  protected logDisabled(reason?: string): void {
    this.logger.warn("Channel listener disabled", this.context, {
      channel: this.channel,
      reason,
    });
  }
}
