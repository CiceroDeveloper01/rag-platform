import { Injectable, Module, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { TenantContextService } from '../../common/tenancy/tenant-context.service';
import { DatabaseService } from '../../infra/database/database.service';
import { SearchModule } from '../search/search.module';
import { ObservabilityModule } from '../../infra/observability/observability.module';
import { OMNICHANNEL_AGENT_EXECUTOR } from './application/interfaces/agent-executor.interface';
import { OMNICHANNEL_CHANNEL_ADAPTER } from './application/interfaces/channel-adapter.interface';
import { OMNICHANNEL_CLOCK_SERVICE } from './application/interfaces/clock-service.interface';
import { OMNICHANNEL_CORRELATION_SERVICE } from './application/interfaces/correlation-service.interface';
import { OMNICHANNEL_MESSAGE_NORMALIZER } from './application/interfaces/message-normalizer.interface';
import { OMNICHANNEL_METRICS_SERVICE } from './application/interfaces/metrics-service.interface';
import { OMNICHANNEL_DASHBOARD_QUERY_REPOSITORY } from './application/interfaces/omnichannel-dashboard-query-repository.interface';
import { OMNICHANNEL_OUTBOUND_DISPATCHER } from './application/interfaces/outbound-dispatcher.interface';
import { OMNICHANNEL_RAG_GATEWAY } from './application/interfaces/rag-gateway.interface';
import { OMNICHANNEL_TRACE_SERVICE } from './application/interfaces/trace-service.interface';
import { EmailInboundDevService } from './application/services/email-inbound-dev.service';
import { EmailInboundProcessingService } from './application/services/email-inbound-processing.service';
import { ExecutionActivityStreamService } from './application/services/execution-activity-stream.service';
import { AiUsagePolicyService } from './application/services/ai-usage-policy.service';
import { IdempotencyService } from './application/services/idempotency.service';
import { EmailPollingService } from './application/services/email-polling.service';
import { ExecutionService } from './application/services/execution.service';
import { OmnichannelConnectorService } from './application/services/omnichannel-connector.service';
import { OmnichannelQueryService } from './application/services/omnichannel-query.service';
import { OmnichannelRuntimePolicyService } from './application/services/omnichannel-runtime-policy.service';
import { OmnichannelOrchestratorService } from './application/services/omnichannel-orchestrator.service';
import { RagUsagePolicyService } from './application/services/rag-usage-policy.service';
import { TelegramWebhookService } from './application/services/telegram-webhook.service';
import { OMNICHANNEL_CONNECTOR_REPOSITORY } from './domain/repositories/connector-repository.interface';
import { OMNICHANNEL_EXECUTION_REPOSITORY } from './domain/repositories/execution-repository.interface';
import { OMNICHANNEL_MESSAGE_REPOSITORY } from './domain/repositories/message-repository.interface';
import { OMNICHANNEL_METRIC_SNAPSHOT_REPOSITORY } from './domain/repositories/metric-snapshot-repository.interface';
import { MessageChannel } from './domain/enums/message-channel.enum';
import { EmailChannelAdapter } from './infra/adapters/channels/email/email-channel.adapter';
import { EmailMessageNormalizer } from './infra/adapters/channels/email/email-message-normalizer.service';
import { RoamChannelAdapterStub } from './infra/adapters/channels/roam/roam-channel.adapter';
import { SlackChannelAdapterStub } from './infra/adapters/channels/slack/slack-channel.adapter';
import { SmsChannelAdapterStub } from './infra/adapters/channels/sms/sms-channel.adapter';
import { TeamsChannelAdapterStub } from './infra/adapters/channels/teams/teams-channel.adapter';
import { TelegramChannelAdapter } from './infra/adapters/channels/telegram/telegram-channel.adapter';
import { TelegramMessageNormalizer } from './infra/adapters/channels/telegram/telegram-message-normalizer.service';
import { VoiceChannelAdapterStub } from './infra/adapters/channels/voice/voice-channel.adapter';
import { WhatsappChannelAdapterStub } from './infra/adapters/channels/whatsapp/whatsapp-channel.adapter';
import { DevEmailOutboundDispatcher } from './infra/dispatchers/dev-email-outbound-dispatcher.service';
import { EmailOutboundDispatcher } from './infra/dispatchers/email-outbound-dispatcher.service';
import { FutureChannelStubDispatcher } from './infra/dispatchers/future-channel-stub-dispatcher.service';
import { TelegramOutboundDispatcher } from './infra/dispatchers/telegram-outbound-dispatcher.service';
import { EmailParserService } from './infra/parsers/email-parser.service';
import { OmnichannelConnectorPostgresRepository } from './infra/persistence/omnichannel-connector-postgres.repository';
import { OmnichannelExecutionPostgresRepository } from './infra/persistence/omnichannel-execution-postgres.repository';
import { OmnichannelMessagePostgresRepository } from './infra/persistence/omnichannel-message-postgres.repository';
import { OmnichannelMetricSnapshotPostgresRepository } from './infra/persistence/omnichannel-metric-snapshot-postgres.repository';
import { OmnichannelDashboardPostgresQueryRepository } from './infra/persistence/query-repositories/omnichannel-dashboard-postgres.query-repository';
import { ExecutionTrackingPostgresRepository } from './infra/persistence/execution-tracking-postgres.repository';
import { DefaultAgentExecutor } from './infra/providers/default-agent-executor.service';
import { DefaultChannelAdapterRegistryService } from './infra/providers/default-channel-adapter-registry.service';
import { DefaultMessageNormalizerService } from './infra/providers/default-message-normalizer.service';
import { DevEmailInboundProvider } from './infra/providers/dev-email-inbound-provider.service';
import { ExistingRagGatewayAdapter } from './infra/providers/existing-rag-gateway.adapter';
import { NoopOutboundDispatcher } from './infra/providers/noop-outbound-dispatcher.service';
import { OutboundDispatcherRegistryService } from './infra/providers/outbound-dispatcher-registry.service';
import { SystemClockService } from './infra/providers/system-clock.service';
import { TelegramApiClient } from './infra/providers/telegram-api-client.service';
import { UuidCorrelationService } from './infra/providers/uuid-correlation.service';
import { OmnichannelMetricsService } from './infra/telemetry/omnichannel-metrics.service';
import { OpenTelemetryTraceService } from './infra/telemetry/opentelemetry-trace.service';
import { OMNICHANNEL_EXECUTION_TRACKING_REPOSITORY } from './application/interfaces/execution-tracking-repository.interface';
import { EmailInboundDevController } from './presentation/controllers/email-inbound-dev.controller';
import { ExecutionStreamController } from './presentation/controllers/execution-stream.controller';
import { OmnichannelController } from './presentation/controllers/omnichannel.controller';
import { OmnichannelDashboardController } from './presentation/controllers/omnichannel-dashboard.controller';
import { TelegramWebhookController } from './presentation/controllers/telegram-webhook.controller';

@Injectable()
class OmnichannelConnectorBootstrapService implements OnModuleInit {
  constructor(
    private readonly connectorRepository: OmnichannelConnectorPostgresRepository,
    private readonly databaseService: DatabaseService,
    private readonly logger: PinoLogger,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.databaseService.isEnabled) {
      return;
    }

    await this.connectorRepository.ensureDefaults([
      { channel: MessageChannel.TELEGRAM, name: 'telegram-default' },
      { channel: MessageChannel.EMAIL, name: 'email-default' },
      { channel: MessageChannel.TEAMS, name: 'teams-default' },
      { channel: MessageChannel.WHATSAPP, name: 'whatsapp-default' },
      { channel: MessageChannel.SLACK, name: 'slack-default' },
      { channel: MessageChannel.SMS, name: 'sms-default' },
      { channel: MessageChannel.VOICE, name: 'voice-default' },
      { channel: MessageChannel.ROAM, name: 'roam-default' },
    ]);
    this.logger.info('Omnichannel connector defaults ensured successfully');
  }
}

@Module({
  imports: [SearchModule, ObservabilityModule],
  controllers: [
    OmnichannelController,
    OmnichannelDashboardController,
    ExecutionStreamController,
    TelegramWebhookController,
    EmailInboundDevController,
  ],
  providers: [
    OmnichannelQueryService,
    OmnichannelRuntimePolicyService,
    OmnichannelConnectorService,
    OmnichannelOrchestratorService,
    ExecutionActivityStreamService,
    AiUsagePolicyService,
    RagUsagePolicyService,
    TelegramWebhookService,
    EmailInboundDevService,
    EmailInboundProcessingService,
    EmailPollingService,
    ExecutionService,
    TenantContextService,
    IdempotencyService,
    DefaultAgentExecutor,
    ExistingRagGatewayAdapter,
    DefaultMessageNormalizerService,
    DefaultChannelAdapterRegistryService,
    OutboundDispatcherRegistryService,
    NoopOutboundDispatcher,
    UuidCorrelationService,
    SystemClockService,
    OmnichannelMetricsService,
    OpenTelemetryTraceService,
    TelegramMessageNormalizer,
    TelegramChannelAdapter,
    EmailMessageNormalizer,
    EmailChannelAdapter,
    TeamsChannelAdapterStub,
    WhatsappChannelAdapterStub,
    SlackChannelAdapterStub,
    SmsChannelAdapterStub,
    VoiceChannelAdapterStub,
    RoamChannelAdapterStub,
    TelegramOutboundDispatcher,
    DevEmailOutboundDispatcher,
    EmailOutboundDispatcher,
    FutureChannelStubDispatcher,
    TelegramApiClient,
    DevEmailInboundProvider,
    EmailParserService,
    OmnichannelMessagePostgresRepository,
    OmnichannelExecutionPostgresRepository,
    OmnichannelConnectorPostgresRepository,
    OmnichannelMetricSnapshotPostgresRepository,
    OmnichannelDashboardPostgresQueryRepository,
    ExecutionTrackingPostgresRepository,
    OmnichannelConnectorBootstrapService,
    {
      provide: OMNICHANNEL_AGENT_EXECUTOR,
      useExisting: DefaultAgentExecutor,
    },
    {
      provide: OMNICHANNEL_RAG_GATEWAY,
      useExisting: ExistingRagGatewayAdapter,
    },
    {
      provide: OMNICHANNEL_MESSAGE_NORMALIZER,
      useExisting: DefaultMessageNormalizerService,
    },
    {
      provide: OMNICHANNEL_CHANNEL_ADAPTER,
      useExisting: DefaultChannelAdapterRegistryService,
    },
    {
      provide: OMNICHANNEL_OUTBOUND_DISPATCHER,
      useExisting: OutboundDispatcherRegistryService,
    },
    {
      provide: OMNICHANNEL_CORRELATION_SERVICE,
      useExisting: UuidCorrelationService,
    },
    {
      provide: OMNICHANNEL_CLOCK_SERVICE,
      useExisting: SystemClockService,
    },
    {
      provide: OMNICHANNEL_METRICS_SERVICE,
      useExisting: OmnichannelMetricsService,
    },
    {
      provide: OMNICHANNEL_TRACE_SERVICE,
      useExisting: OpenTelemetryTraceService,
    },
    {
      provide: OMNICHANNEL_DASHBOARD_QUERY_REPOSITORY,
      useExisting: OmnichannelDashboardPostgresQueryRepository,
    },
    {
      provide: OMNICHANNEL_MESSAGE_REPOSITORY,
      useExisting: OmnichannelMessagePostgresRepository,
    },
    {
      provide: OMNICHANNEL_EXECUTION_REPOSITORY,
      useExisting: OmnichannelExecutionPostgresRepository,
    },
    {
      provide: OMNICHANNEL_EXECUTION_TRACKING_REPOSITORY,
      useExisting: ExecutionTrackingPostgresRepository,
    },
    {
      provide: OMNICHANNEL_CONNECTOR_REPOSITORY,
      useExisting: OmnichannelConnectorPostgresRepository,
    },
    {
      provide: OMNICHANNEL_METRIC_SNAPSHOT_REPOSITORY,
      useExisting: OmnichannelMetricSnapshotPostgresRepository,
    },
  ],
})
export class OmnichannelModule {}
