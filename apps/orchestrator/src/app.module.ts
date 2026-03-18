import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "@rag-platform/config";
import { z } from "zod";
import { appConfig } from "./config/app.config";
import { featureTogglesConfig } from "./config/feature-toggles.config";
import { internalApiConfig } from "./config/internal-api.config";
import { listenersConfig } from "./config/listeners.config";
import { queueConfig } from "./config/queue.config";
import { ragConfig } from "./config/rag.config";
import { rabbitMqConfig } from "./config/rabbitmq.config";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AgentTraceModule } from "./modules/agent-trace/agent-trace.module";
import { AgentsModule } from "./modules/agents/agents.module";
import { CostMonitoringModule } from "./modules/cost-monitoring/cost-monitoring.module";
import { HealthModule } from "./modules/health/health.module";
import { ChannelsModule } from "./modules/channels/channels.module";
import { ProcessorsModule } from "./modules/processors/processors.module";
import { QueueModule } from "./modules/queue/queue.module";
import { DocumentIngestionModule } from "./modules/document-ingestion/document-ingestion.module";
import { SimulationModule } from "./modules/simulation/simulation.module";
import { TenancyModule } from "./modules/tenancy/tenancy.module";
import { TrainingModule } from "./modules/training/training.module";

const orchestratorEnvironmentSchema = z.object({
  APP_NAME: z.string().optional(),
  APP_VERSION: z.string().optional(),
  NODE_ENV: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_DB: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  PORT: z.string().optional(),
  INBOUND_QUEUE_NAME: z.string().optional(),
  INBOUND_QUEUE_CONCURRENCY: z.string().optional(),
  INBOUND_QUEUE_ATTEMPTS: z.string().optional(),
  INBOUND_QUEUE_BACKOFF_MS: z.string().optional(),
  INBOUND_QUEUE_DLQ_NAME: z.string().optional(),
  INBOUND_QUEUE_COMPLETED_RETENTION_SECONDS: z.string().optional(),
  INBOUND_QUEUE_FAILED_RETENTION_SECONDS: z.string().optional(),
  FLOW_EXECUTION_QUEUE_NAME: z.string().optional(),
  FLOW_EXECUTION_QUEUE_CONCURRENCY: z.string().optional(),
  FLOW_EXECUTION_QUEUE_ATTEMPTS: z.string().optional(),
  FLOW_EXECUTION_QUEUE_BACKOFF_MS: z.string().optional(),
  FLOW_EXECUTION_QUEUE_DLQ_NAME: z.string().optional(),
  FLOW_EXECUTION_QUEUE_COMPLETED_RETENTION_SECONDS: z.string().optional(),
  FLOW_EXECUTION_QUEUE_FAILED_RETENTION_SECONDS: z.string().optional(),
  INTERNAL_API_BASE_URL: z.string().optional(),
  INTERNAL_API_REQUEST_TIMEOUT_MS: z.string().optional(),
  INTERNAL_API_INGESTION_REQUEST_PATH: z.string().optional(),
  INTERNAL_API_INGESTION_COMPLETE_PATH: z.string().optional(),
  INTERNAL_API_INGESTION_FAIL_PATH: z.string().optional(),
  INTERNAL_API_INGESTION_STATUS_PATH: z.string().optional(),
  HTTP_RETRY_ENABLED: z.string().optional(),
  HTTP_RETRY_MAX_ATTEMPTS: z.string().optional(),
  HTTP_RETRY_INITIAL_DELAY_MS: z.string().optional(),
  HTTP_RETRY_MAX_DELAY_MS: z.string().optional(),
  HTTP_CIRCUIT_BREAKER_ENABLED: z.string().optional(),
  HTTP_CIRCUIT_BREAKER_FAILURE_THRESHOLD: z.string().optional(),
  HTTP_CIRCUIT_BREAKER_OPEN_MS: z.string().optional(),
  INTERNAL_API_DOCUMENTS_REGISTER_PATH: z.string().optional(),
  INTERNAL_API_CONVERSATIONS_REPLY_PATH: z.string().optional(),
  INTERNAL_API_HANDOFF_PATH: z.string().optional(),
  INTERNAL_API_SEARCH_PATH: z.string().optional(),
  INTERNAL_API_MEMORY_STORE_PATH: z.string().optional(),
  INTERNAL_API_MEMORY_CONTEXT_PATH: z.string().optional(),
  RAG_RETRIEVAL_TOP_K: z.string().optional(),
  EMAIL_LISTENER_ENABLED: z.string().optional(),
  EMAIL_LISTENER_MODE: z.string().optional(),
  EMAIL_LISTENER_POLL_INTERVAL_MS: z.string().optional(),
  EMAIL_LISTENER_API_BASE_URL: z.string().optional(),
  EMAIL_LISTENER_API_TOKEN: z.string().optional(),
  EMAIL_LISTENER_OUTBOUND_PATH: z.string().optional(),
  EMAIL_LISTENER_TIMEOUT_MS: z.string().optional(),
  EMAIL_LISTENER_RETRY_ENABLED: z.string().optional(),
  EMAIL_LISTENER_RETRY_MAX_ATTEMPTS: z.string().optional(),
  EMAIL_LISTENER_RETRY_INITIAL_DELAY_MS: z.string().optional(),
  EMAIL_LISTENER_RETRY_MAX_DELAY_MS: z.string().optional(),
  TELEGRAM_LISTENER_ENABLED: z.string().optional(),
  TELEGRAM_LISTENER_BOT_TOKEN: z.string().optional(),
  TELEGRAM_LISTENER_BOT_USERNAME: z.string().optional(),
  TELEGRAM_LISTENER_MODE: z.string().optional(),
  TELEGRAM_LISTENER_POLLING_INTERVAL_MS: z.string().optional(),
  TELEGRAM_LISTENER_WEBHOOK_SECRET: z.string().optional(),
  TELEGRAM_LISTENER_API_BASE_URL: z.string().optional(),
  TELEGRAM_LISTENER_TIMEOUT_MS: z.string().optional(),
  TELEGRAM_LISTENER_RETRY_ENABLED: z.string().optional(),
  TELEGRAM_LISTENER_RETRY_MAX_ATTEMPTS: z.string().optional(),
  TELEGRAM_LISTENER_RETRY_INITIAL_DELAY_MS: z.string().optional(),
  TELEGRAM_LISTENER_RETRY_MAX_DELAY_MS: z.string().optional(),
  TELEGRAM_ENABLED: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_BOT_USERNAME: z.string().optional(),
  DOCUMENT_INGESTION_ENABLED: z.string().optional(),
  DOCUMENT_PARSING_ENABLED: z.string().optional(),
  RAG_RETRIEVAL_ENABLED: z.string().optional(),
  CONVERSATION_MEMORY_ENABLED: z.string().optional(),
  EVALUATION_ENABLED: z.string().optional(),
  OUTBOUND_SENDING_ENABLED: z.string().optional(),
  WHATSAPP_LISTENER_ENABLED: z.string().optional(),
  WHATSAPP_LISTENER_MODE: z.string().optional(),
  WHATSAPP_LISTENER_API_BASE_URL: z.string().optional(),
  WHATSAPP_LISTENER_API_TOKEN: z.string().optional(),
  WHATSAPP_LISTENER_OUTBOUND_PATH: z.string().optional(),
  WHATSAPP_LISTENER_TIMEOUT_MS: z.string().optional(),
  WHATSAPP_LISTENER_RETRY_ENABLED: z.string().optional(),
  WHATSAPP_LISTENER_RETRY_MAX_ATTEMPTS: z.string().optional(),
  WHATSAPP_LISTENER_RETRY_INITIAL_DELAY_MS: z.string().optional(),
  WHATSAPP_LISTENER_RETRY_MAX_DELAY_MS: z.string().optional(),
  RABBITMQ_HOST: z.string().optional(),
  RABBITMQ_PORT: z.string().optional(),
  RABBITMQ_USER: z.string().optional(),
  RABBITMQ_USERNAME: z.string().optional(),
  RABBITMQ_PASS: z.string().optional(),
  RABBITMQ_PASSWORD: z.string().optional(),
  RABBITMQ_VHOST: z.string().optional(),
  RABBITMQ_QUEUE_DOCUMENT_INGESTION: z.string().optional(),
  RABBITMQ_DOCUMENT_INGESTION_QUEUE: z.string().optional(),
  RABBITMQ_DOCUMENT_INGESTION_EXCHANGE: z.string().optional(),
  RABBITMQ_DOCUMENT_INGESTION_ROUTING_KEY: z.string().optional(),
  RABBITMQ_DOCUMENT_INGESTION_RETRY_EXCHANGE: z.string().optional(),
  RABBITMQ_DOCUMENT_INGESTION_RETRY_QUEUE: z.string().optional(),
  RABBITMQ_DOCUMENT_INGESTION_RETRY_ROUTING_KEY: z.string().optional(),
  RABBITMQ_DOCUMENT_INGESTION_RETRY_DELAY_MS: z.string().optional(),
  RABBITMQ_DOCUMENT_INGESTION_MAX_ATTEMPTS: z.string().optional(),
  RABBITMQ_DOCUMENT_INGESTION_DLX: z.string().optional(),
  RABBITMQ_DOCUMENT_INGESTION_DLQ: z.string().optional(),
  RABBITMQ_DOCUMENT_INGESTION_DLQ_ROUTING_KEY: z.string().optional(),
  RABBITMQ_DOCUMENT_INGESTION_PREFETCH: z.string().optional(),
  INTERNAL_API_INGESTION_START_PATH: z.string().optional(),
  TRAINING_PIPELINE_ENABLED: z.string().optional(),
  TRAINING_PIPELINE_INTERVAL_MS: z.string().optional(),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [
        appConfig,
        queueConfig,
        internalApiConfig,
        listenersConfig,
        ragConfig,
        rabbitMqConfig,
        featureTogglesConfig,
      ],
      validate: (config) => validateEnv(orchestratorEnvironmentSchema, config),
    }),
    AnalyticsModule,
    HealthModule,
    TenancyModule,
    CostMonitoringModule,
    AgentTraceModule,
    QueueModule,
    DocumentIngestionModule,
    AgentsModule,
    ChannelsModule,
    ProcessorsModule,
    SimulationModule,
    TrainingModule,
  ],
})
export class AppModule {}
