import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Channel } from "@rag-platform/contracts";
import { AppLoggerService } from "@rag-platform/observability";
import { BaseChannelListener } from "../../core/interfaces/base-channel.listener";
import { InboundMessagesQueueService } from "../../../queue/inbound-messages.queue";
import { InboundMessagePayload } from "../../../queue/inbound-message.types";
import { EmailInboundAdapter } from "../inbound/email.inbound.adapter";
import { EmailInboundPayload } from "../types/email.types";

@Injectable()
export class EmailListener extends BaseChannelListener {
  readonly channel = Channel.EMAIL;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailInboundAdapter: EmailInboundAdapter,
    logger: AppLoggerService,
    inboundMessagesQueueService: InboundMessagesQueueService,
  ) {
    super(logger, inboundMessagesQueueService, EmailListener.name);
  }

  async start(): Promise<void> {
    const enabled = this.configService.get<boolean>(
      "listeners.email.enabled",
      true,
    );
    if (!enabled) {
      this.logDisabled();
      return;
    }

    const mode =
      this.configService.get<string>("listeners.email.mode", "manual") ??
      "manual";
    this.logReady({ mode });
  }

  async receive(event: InboundMessagePayload): Promise<void> {
    await this.publishInboundMessage(event);
  }

  async receiveRaw(event: EmailInboundPayload): Promise<void> {
    const payload = this.emailInboundAdapter.toInboundMessage(event);
    if (!payload) {
      this.logger.warn("Ignoring empty email payload", EmailListener.name, {
        channel: this.channel,
        externalMessageId: event.externalMessageId,
      });
      return;
    }

    await this.publishInboundMessage(payload);
  }
}
