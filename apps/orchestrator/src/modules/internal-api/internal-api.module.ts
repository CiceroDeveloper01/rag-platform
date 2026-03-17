import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ConversationsClient,
  ConversationsInternalClient,
  DocumentIngestionClient,
  DocumentIngestionInternalClient,
  DocumentsClient,
  DocumentsInternalClient,
  HandoffClient,
  HandoffInternalClient,
  InternalApiClient,
  MemoryInternalClient,
  RagSearchInternalClient,
} from "@rag-platform/sdk";
import {
  AppLoggerService,
  LoggerModule,
  MetricsService,
} from "@rag-platform/observability";

@Module({
  imports: [LoggerModule],
  providers: [
    MetricsService,
    {
      provide: InternalApiClient,
      inject: [ConfigService, AppLoggerService, MetricsService],
      useFactory: (
        configService: ConfigService,
        logger: AppLoggerService,
        metricsService: MetricsService,
      ) =>
        new InternalApiClient({
          baseUrl: configService.getOrThrow<string>("internalApi.baseUrl"),
          timeoutMs:
            configService.get<number>("internalApi.timeoutMs", 10_000) ??
            10_000,
          retryEnabled:
            configService.get<boolean>("internalApi.retryEnabled", true) ??
            true,
          retryMaxAttempts:
            configService.get<number>("internalApi.retryMaxAttempts", 3) ?? 3,
          retryInitialDelayMs:
            configService.get<number>("internalApi.retryInitialDelayMs", 250) ??
            250,
          retryMaxDelayMs:
            configService.get<number>("internalApi.retryMaxDelayMs", 2_000) ??
            2_000,
          circuitBreakerEnabled:
            configService.get<boolean>(
              "internalApi.circuitBreakerEnabled",
              true,
            ) ?? true,
          circuitBreakerFailureThreshold:
            configService.get<number>(
              "internalApi.circuitBreakerFailureThreshold",
              5,
            ) ?? 5,
          circuitBreakerOpenMs:
            configService.get<number>(
              "internalApi.circuitBreakerOpenMs",
              30_000,
            ) ?? 30_000,
          onRetryAttempt: (context) => {
            logger.warn(
              "Internal API retry attempt",
              InternalApiModule.name,
              context,
            );
            metricsService.increment("internal_api_retry_attempts_total");
          },
          onFinalFailure: (context) => {
            logger.error(
              "Internal API request failed after retries",
              undefined,
              InternalApiModule.name,
              context,
            );
            metricsService.increment("internal_api_retry_failures_total");
          },
          onCircuitOpen: (context) => {
            logger.error(
              "Internal API circuit breaker opened",
              undefined,
              InternalApiModule.name,
              context,
            );
            metricsService.increment("internal_api_circuit_open_total");
          },
          onCircuitClose: (context) => {
            logger.log(
              "Internal API circuit breaker closed",
              InternalApiModule.name,
              context,
            );
            metricsService.increment("internal_api_circuit_close_total");
          },
        }),
    },
    {
      provide: DocumentsClient,
      inject: [InternalApiClient, ConfigService],
      useFactory: (
        httpClient: InternalApiClient,
        configService: ConfigService,
      ) =>
        new DocumentsClient(
          httpClient,
          configService.getOrThrow<string>(
            "internalApi.paths.registerDocument",
          ),
        ),
    },
    {
      provide: ConversationsClient,
      inject: [InternalApiClient, ConfigService],
      useFactory: (
        httpClient: InternalApiClient,
        configService: ConfigService,
      ) =>
        new ConversationsClient(
          httpClient,
          configService.getOrThrow<string>(
            "internalApi.paths.replyConversation",
          ),
        ),
    },
    {
      provide: HandoffClient,
      inject: [InternalApiClient, ConfigService],
      useFactory: (
        httpClient: InternalApiClient,
        configService: ConfigService,
      ) =>
        new HandoffClient(
          httpClient,
          configService.getOrThrow<string>("internalApi.paths.handoff"),
        ),
    },
    {
      provide: DocumentIngestionClient,
      inject: [InternalApiClient, ConfigService],
      useFactory: (
        httpClient: InternalApiClient,
        configService: ConfigService,
      ) =>
        new DocumentIngestionClient(
          httpClient,
          configService.getOrThrow<string>(
            "internalApi.paths.completeDocumentIngestion",
          ),
          configService.getOrThrow<string>(
            "internalApi.paths.failDocumentIngestion",
          ),
        ),
    },
    {
      provide: DocumentsInternalClient,
      inject: [InternalApiClient, ConfigService],
      useFactory: (
        httpClient: InternalApiClient,
        configService: ConfigService,
      ) =>
        new DocumentsInternalClient(
          httpClient,
          configService.getOrThrow<string>(
            "internalApi.paths.registerDocument",
          ),
        ),
    },
    {
      provide: DocumentIngestionInternalClient,
      inject: [InternalApiClient, ConfigService],
      useFactory: (
        httpClient: InternalApiClient,
        configService: ConfigService,
      ) =>
        new DocumentIngestionInternalClient(
          httpClient,
          configService.getOrThrow<string>(
            "internalApi.paths.completeDocumentIngestion",
          ),
          configService.getOrThrow<string>(
            "internalApi.paths.failDocumentIngestion",
          ),
        ),
    },
    {
      provide: ConversationsInternalClient,
      inject: [InternalApiClient, ConfigService],
      useFactory: (
        httpClient: InternalApiClient,
        configService: ConfigService,
      ) =>
        new ConversationsInternalClient(
          httpClient,
          configService.getOrThrow<string>(
            "internalApi.paths.replyConversation",
          ),
        ),
    },
    {
      provide: HandoffInternalClient,
      inject: [InternalApiClient, ConfigService],
      useFactory: (
        httpClient: InternalApiClient,
        configService: ConfigService,
      ) =>
        new HandoffInternalClient(
          httpClient,
          configService.getOrThrow<string>("internalApi.paths.handoff"),
        ),
    },
    {
      provide: RagSearchInternalClient,
      inject: [InternalApiClient, ConfigService],
      useFactory: (
        httpClient: InternalApiClient,
        configService: ConfigService,
      ) =>
        new RagSearchInternalClient(
          httpClient,
          configService.getOrThrow<string>("internalApi.paths.search"),
        ),
    },
    {
      provide: MemoryInternalClient,
      inject: [InternalApiClient, ConfigService],
      useFactory: (
        httpClient: InternalApiClient,
        configService: ConfigService,
      ) =>
        new MemoryInternalClient(
          httpClient,
          configService.getOrThrow<string>("internalApi.paths.memoryStore"),
          configService.getOrThrow<string>("internalApi.paths.memoryContext"),
        ),
    },
  ],
  exports: [
    InternalApiClient,
    DocumentIngestionClient,
    DocumentsClient,
    ConversationsClient,
    HandoffClient,
    DocumentsInternalClient,
    DocumentIngestionInternalClient,
    ConversationsInternalClient,
    HandoffInternalClient,
    MemoryInternalClient,
    RagSearchInternalClient,
  ],
})
export class InternalApiModule {}
