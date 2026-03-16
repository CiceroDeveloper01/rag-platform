import { Module } from "@nestjs/common";
import { QueueModule } from "../queue/queue.module";
import { EmailListener } from "./email.listener";
import { ListenersBootstrapService } from "./listeners-bootstrap.service";
import { TelegramListener } from "./telegram.listener";
import { WhatsAppListener } from "./whatsapp.listener";

@Module({
  imports: [QueueModule],
  providers: [
    EmailListener,
    TelegramListener,
    WhatsAppListener,
    ListenersBootstrapService,
  ],
  exports: [EmailListener, TelegramListener, WhatsAppListener],
})
export class ListenersModule {}
