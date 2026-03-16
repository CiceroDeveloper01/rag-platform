import { Module } from "@nestjs/common";
import {
  LoggerModule,
  MetricsService,
  TracingModule,
} from "@rag-platform/observability";
import { AgentTraceModule } from "../agent-trace/agent-trace.module";
import { QueueModule } from "../queue/queue.module";
import { CHANNEL_LISTENERS } from "./channel-listeners.token";
import { ChannelsBootstrapService } from "./channels-bootstrap.service";
import { ChannelHttpClient } from "./channel-http.client";
import { EmailListener } from "./email.listener";
import { EmailInboundAdapter } from "./email.inbound.adapter";
import { EmailOutboundService } from "./email.outbound.service";
import { ChannelOutboundRouterService } from "./channel-outbound-router.service";
import { TelegramInboundAdapter } from "./telegram.inbound.adapter";
import { TelegramCommandService } from "./telegram-command.service";
import { TelegramListener } from "./telegram.listener";
import { TelegramOutboundService } from "./telegram.outbound.service";
import { TelegramPollingService } from "./telegram.polling.service";
import { TelegramResponseComposerService } from "./telegram-response-composer.service";
import { WhatsAppInboundAdapter } from "./whatsapp.inbound.adapter";
import { WhatsAppOutboundService } from "./whatsapp.outbound.service";
import { WhatsAppListener } from "./whatsapp.listener";

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
