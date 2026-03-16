import { Module } from "@nestjs/common";
import {
  LoggerModule,
  MetricsService,
  TracingModule,
} from "@rag-platform/observability";
import { AgentTraceModule } from "../agent-trace/agent-trace.module";
import { QueueModule } from "../queue/queue.module";
import { CHANNEL_LISTENERS } from "./core/bootstrap/channel-listeners.token";
import { ChannelsBootstrapService } from "./core/bootstrap/channels-bootstrap.service";
import { ChannelHttpClient } from "./core/http/channel-http.client";
import { ChannelOutboundRouterService } from "./core/router/channel-outbound-router.service";
import { EmailInboundAdapter } from "./email/inbound/email.inbound.adapter";
import { EmailListener } from "./email/listener/email.listener";
import { EmailOutboundService } from "./email/outbound/email.outbound.service";
import { TelegramCommandService } from "./telegram/commands/telegram-command.service";
import { TelegramResponseComposerService } from "./telegram/composer/telegram-response-composer.service";
import { TelegramInboundAdapter } from "./telegram/inbound/telegram.inbound.adapter";
import { TelegramListener } from "./telegram/listener/telegram.listener";
import { TelegramOutboundService } from "./telegram/outbound/telegram.outbound.service";
import { TelegramPollingService } from "./telegram/polling/telegram.polling.service";
import { WhatsAppInboundAdapter } from "./whatsapp/inbound/whatsapp.inbound.adapter";
import { WhatsAppListener } from "./whatsapp/listener/whatsapp.listener";
import { WhatsAppOutboundService } from "./whatsapp/outbound/whatsapp.outbound.service";

const channelListenerProviders = [
  EmailListener,
  TelegramListener,
  WhatsAppListener,
];

@Module({
  imports: [LoggerModule, TracingModule, AgentTraceModule, QueueModule],
  providers: [
    MetricsService,
    ...channelListenerProviders,
    ChannelHttpClient,
    ChannelOutboundRouterService,
    EmailInboundAdapter,
    EmailOutboundService,
    TelegramInboundAdapter,
    TelegramCommandService,
    TelegramPollingService,
    TelegramOutboundService,
    TelegramResponseComposerService,
    WhatsAppInboundAdapter,
    WhatsAppOutboundService,
    {
      provide: CHANNEL_LISTENERS,
      inject: channelListenerProviders,
      useFactory: (
        emailListener: EmailListener,
        telegramListener: TelegramListener,
        whatsappListener: WhatsAppListener,
      ) => [emailListener, telegramListener, whatsappListener],
    },
    ChannelsBootstrapService,
  ],
  exports: [
    CHANNEL_LISTENERS,
    EmailListener,
    EmailInboundAdapter,
    EmailOutboundService,
    ChannelOutboundRouterService,
    TelegramListener,
    TelegramInboundAdapter,
    TelegramCommandService,
    TelegramOutboundService,
    TelegramPollingService,
    TelegramResponseComposerService,
    WhatsAppInboundAdapter,
    WhatsAppOutboundService,
    WhatsAppListener,
  ],
})
export class ChannelsModule {}
