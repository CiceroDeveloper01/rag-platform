import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { EmailListener } from "./email.listener";
import { TelegramListener } from "./telegram.listener";
import { WhatsAppListener } from "./whatsapp.listener";

@Injectable()
export class ListenersBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ListenersBootstrapService.name);

  constructor(
    private readonly emailListener: EmailListener,
    private readonly telegramListener: TelegramListener,
    private readonly whatsappListener: WhatsAppListener,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log("Starting inbound listeners");
    await Promise.all([
      this.emailListener.start(),
      this.telegramListener.start(),
      this.whatsappListener.start(),
    ]);
  }
}
