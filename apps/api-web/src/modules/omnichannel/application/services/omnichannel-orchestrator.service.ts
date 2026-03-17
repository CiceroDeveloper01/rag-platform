import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { MetricTimer } from '../../../../common/observability/decorators/metric-timer.decorator';
import { Trace } from '../../../../common/observability/decorators/trace.decorator';
import { FeatureFlagsService } from '../../../../common/feature-flags/feature-flags.service';
import { TraceContextHelper } from '../../../../common/observability/helpers/trace-context.helper';
import { OMNICHANNEL_AGENT_EXECUTOR } from '../interfaces/agent-executor.interface';
import type {
  AgentExecutionRequest,
  IAgentExecutor,
} from '../interfaces/agent-executor.interface';
import { OMNICHANNEL_CLOCK_SERVICE } from '../interfaces/clock-service.interface';
import type { IClockService } from '../interfaces/clock-service.interface';
import { OMNICHANNEL_CORRELATION_SERVICE } from '../interfaces/correlation-service.interface';
import type { ICorrelationService } from '../interfaces/correlation-service.interface';
import { OMNICHANNEL_MESSAGE_NORMALIZER } from '../interfaces/message-normalizer.interface';
import type { IMessageNormalizer } from '../interfaces/message-normalizer.interface';
import { OMNICHANNEL_METRICS_SERVICE } from '../interfaces/metrics-service.interface';
import type { IMetricsService } from '../interfaces/metrics-service.interface';
import { OMNICHANNEL_OUTBOUND_DISPATCHER } from '../interfaces/outbound-dispatcher.interface';
import type { IOutboundDispatcher } from '../interfaces/outbound-dispatcher.interface';
import { OMNICHANNEL_RAG_GATEWAY } from '../interfaces/rag-gateway.interface';
import type { IRagGateway } from '../interfaces/rag-gateway.interface';
import { OMNICHANNEL_TRACE_SERVICE } from '../interfaces/trace-service.interface';
import type { ITraceService } from '../interfaces/trace-service.interface';
import { ProcessOmnichannelMessageDto } from '../dto/process-omnichannel-message.dto';
import { AiUsagePolicyService } from './ai-usage-policy.service';
import { ExecutionService } from './execution.service';
import { OmnichannelRuntimePolicyService } from './omnichannel-runtime-policy.service';
import {
  RagDecisionResult,
  RagUsagePolicyService,
} from './rag-usage-policy.service';
import { NormalizedMessagePayload } from '../../domain/value-objects/normalized-message-payload.value-object';
import { OmnichannelMessage } from '../../domain/entities/omnichannel-message.entity';
import { OMNICHANNEL_MESSAGE_REPOSITORY } from '../../domain/repositories/message-repository.interface';
import type { IMessageRepository } from '../../domain/repositories/message-repository.interface';
import { OmnichannelExecution } from '../../domain/entities/omnichannel-execution.entity';
import { OMNICHANNEL_EXECUTION_REPOSITORY } from '../../domain/repositories/execution-repository.interface';
import type { IExecutionRepository } from '../../domain/repositories/execution-repository.interface';
import { OMNICHANNEL_METRIC_SNAPSHOT_REPOSITORY } from '../../domain/repositories/metric-snapshot-repository.interface';
import type { IMetricSnapshotRepository } from '../../domain/repositories/metric-snapshot-repository.interface';
import { ExecutionEventName } from '../../domain/enums/execution-event-name.enum';
import { OmnichannelExecutionStatus } from '../../domain/enums/omnichannel-execution-status.enum';
import { OmnichannelMessageStatus } from '../../domain/enums/omnichannel-message-status.enum';

@Injectable()
export class OmnichannelOrchestratorService {
  constructor(
    @Inject(OMNICHANNEL_MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
    @Inject(OMNICHANNEL_EXECUTION_REPOSITORY)
    private readonly executionRepository: IExecutionRepository,
    @Inject(OMNICHANNEL_METRIC_SNAPSHOT_REPOSITORY)
    private readonly metricSnapshotRepository: IMetricSnapshotRepository,
    @Inject(OMNICHANNEL_MESSAGE_NORMALIZER)
    private readonly messageNormalizer: IMessageNormalizer,
    @Inject(OMNICHANNEL_AGENT_EXECUTOR)
    private readonly agentExecutor: IAgentExecutor,
    @Inject(OMNICHANNEL_RAG_GATEWAY)
    private readonly ragGateway: IRagGateway,
    @Inject(OMNICHANNEL_OUTBOUND_DISPATCHER)
    private readonly outboundDispatcher: IOutboundDispatcher,
    @Inject(OMNICHANNEL_TRACE_SERVICE)
    private readonly traceService: ITraceService,
    @Inject(OMNICHANNEL_CORRELATION_SERVICE)
    private readonly correlationService: ICorrelationService,
    @Inject(OMNICHANNEL_METRICS_SERVICE)
    private readonly metricsService: IMetricsService,
    @Inject(OMNICHANNEL_CLOCK_SERVICE)
    private readonly clockService: IClockService,
    private readonly executionService: ExecutionService,
    private readonly runtimePolicyService: OmnichannelRuntimePolicyService,
    private readonly aiUsagePolicyService: AiUsagePolicyService,
    private readonly ragUsagePolicyService: RagUsagePolicyService,
    private readonly featureFlagsService: FeatureFlagsService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OmnichannelOrchestratorService.name);
  }

  @Trace('omnichannel.orchestrator.process')
  @MetricTimer({
    metricName: 'omnichannel_orchestrator_duration_ms',
    labels: { module: 'omnichannel' },
  })
  async process(dto: ProcessOmnichannelMessageDto) {
    this.runtimePolicyService.assertApiRuntimeEnabled('omnichannel.process');

    if (!this.configService.get<boolean>('omnichannel.enabled', true)) {
      throw new BadRequestException('Omnichannel module is disabled');
    }

    const correlationId =
      TraceContextHelper.getCorrelationId() ?? this.correlationService.create();
    const traceId = this.traceService.getCurrentTraceId() ?? correlationId;
    const startedAt = this.clockService.now();
    const normalizedPayload = this.messageNormalizer.normalize(
      new NormalizedMessagePayload({
        channel: dto.channel,
        body: dto.body,
        normalizedText: dto.body,
        externalMessageId: dto.externalMessageId,
        conversationId: dto.conversationId,
        senderId: dto.senderId,
        senderName: dto.senderName,
        senderAddress: dto.senderAddress,
        recipientAddress: dto.recipientAddress,
        subject: dto.subject,
        metadata: dto.metadata,
      }),
    );

    let inboundMessage = await this.traceService.runInChildSpan(
      traceId,
      'omnichannel.inbound.persist',
      async () => {
        const message = OmnichannelMessage.createInbound({
          ...normalizedPayload.toObject(),
        })
          .markNormalized(startedAt)
          .markProcessing(startedAt);

        return this.messageRepository.create(message);
      },
      { channel: dto.channel },
    );

    let execution = await this.executionRepository.create(
      OmnichannelExecution.start({
        messageId: inboundMessage.id!,
        traceId,
        spanId: TraceContextHelper.getSpanId() ?? 'unknown_span',
        agentName: this.configService.get<string>(
          'omnichannel.defaultAgent',
          'rag-agent',
        ),
      }),
    );
    const trackedExecution = await this.executionService.createExecution({
      sourceType: 'omnichannel_request',
      sourceId: inboundMessage.id!,
      channel: inboundMessage.channel,
      correlationId,
      traceId,
      startedAt,
    });

    try {
      await this.executionService.logEvent({
        executionId: trackedExecution.id,
        eventName: ExecutionEventName.MESSAGE_RECEIVED,
        metadata: {
          channel: inboundMessage.channel,
          messageId: inboundMessage.id,
          externalMessageId:
            inboundMessage.toObject().externalMessageId ?? null,
        },
        occurredAt: startedAt,
      });
      await this.executionService.logEvent({
        executionId: trackedExecution.id,
        eventName: ExecutionEventName.MESSAGE_NORMALIZED,
        metadata: {
          conversationId: inboundMessage.toObject().conversationId ?? null,
          channel: inboundMessage.channel,
        },
        occurredAt: startedAt,
      });

      let ragDecision: RagDecisionResult;

      if (!this.featureFlagsService.isRagEnabled()) {
        await this.executionService.logEvent({
          executionId: trackedExecution.id,
          eventName: ExecutionEventName.FEATURE_FLAG_FALLBACK_APPLIED,
          metadata: {
            channel: inboundMessage.channel,
            feature: 'rag',
          },
          occurredAt: startedAt,
        });
        this.featureFlagsService.recordDisabledHit('rag', {
          channel: inboundMessage.channel,
          messageId: inboundMessage.id,
        });
        ragDecision = {
          useRag: false,
          matchedKeywords: [],
          reason: 'feature_flag_disabled',
        };
      } else {
        await this.executionService.logEvent({
          executionId: trackedExecution.id,
          eventName: ExecutionEventName.FEATURE_FLAG_CHECKED,
          metadata: {
            channel: inboundMessage.channel,
            feature: 'rag',
          },
          occurredAt: startedAt,
        });
        ragDecision = await this.traceService.runInChildSpan(
          traceId,
          'omnichannel.rag.decision',
          async () =>
            this.ragUsagePolicyService.evaluate(inboundMessage.normalizedText),
        );
      }

      const ragResult = ragDecision.useRag
        ? await this.traceService.runInChildSpan(
            traceId,
            'omnichannel.rag.query',
            async () => {
              await this.executionService.logEvent({
                executionId: trackedExecution.id,
                eventName: ExecutionEventName.RAG_RETRIEVAL_STARTED,
                metadata: {
                  channel: inboundMessage.channel,
                  question: inboundMessage.normalizedText,
                  matchedKeywords: ragDecision.matchedKeywords,
                },
              });

              const inboundMetadata = inboundMessage.toObject().metadata;
              const result = await this.ragGateway.query({
                tenantId:
                  typeof inboundMetadata?.tenantId === 'string'
                    ? inboundMetadata.tenantId
                    : 'default-tenant',
                question: inboundMessage.normalizedText,
                topK: 5,
              });

              await this.executionService.logEvent({
                executionId: trackedExecution.id,
                eventName: ExecutionEventName.RAG_RETRIEVAL_COMPLETED,
                metadata: {
                  channel: inboundMessage.channel,
                  contextsCount: result.contexts.length,
                  question: result.question,
                },
              });

              return result;
            },
            { matchedKeywords: ragDecision.matchedKeywords.join(',') },
          )
        : null;

      if (ragDecision.useRag) {
        this.metricsService.recordRagUsage(inboundMessage.channel);
      }

      const aiUsagePolicy = this.featureFlagsService.isAiUsagePolicyEnabled()
        ? await this.traceService.runInChildSpan(
            traceId,
            'ai.policy.evaluate',
            async () =>
              this.aiUsagePolicyService.evaluate(inboundMessage, ragResult),
            {
              channel: inboundMessage.channel,
            },
          )
        : {
            allow: true,
            estimatedPromptTokens: 0,
            maxPromptTokens: this.configService.get<number>(
              'ai.maxPromptTokens',
              4_000,
            ),
            maxCompletionTokens: this.configService.get<number>(
              'ai.maxCompletionTokens',
              1_000,
            ),
            rateLimitKey: 'feature-flag-disabled',
          };

      await this.executionService.logEvent({
        executionId: trackedExecution.id,
        eventName: ExecutionEventName.AI_POLICY_CHECKED,
        metadata: {
          channel: inboundMessage.channel,
          estimatedPromptTokens: aiUsagePolicy.estimatedPromptTokens,
          maxPromptTokens: aiUsagePolicy.maxPromptTokens,
          maxCompletionTokens: aiUsagePolicy.maxCompletionTokens,
        },
      });

      if (!this.featureFlagsService.isAiUsagePolicyEnabled()) {
        await this.executionService.logEvent({
          executionId: trackedExecution.id,
          eventName: ExecutionEventName.FEATURE_FLAG_FALLBACK_APPLIED,
          metadata: {
            channel: inboundMessage.channel,
            feature: 'ai_usage_policy',
          },
        });
        this.featureFlagsService.recordDisabledHit('ai_usage_policy', {
          channel: inboundMessage.channel,
          messageId: inboundMessage.id,
        });
      }

      if (!aiUsagePolicy.allow) {
        const finishedAt = this.clockService.now();
        const latencyMs = finishedAt.getTime() - startedAt.getTime();
        const safeResponseText = this.buildAiPolicyRejectionMessage(
          aiUsagePolicy.reason,
        );

        await this.executionService.logEvent({
          executionId: trackedExecution.id,
          eventName: ExecutionEventName.AI_POLICY_REJECTED,
          metadata: {
            channel: inboundMessage.channel,
            reason: aiUsagePolicy.reason ?? 'UNKNOWN',
          },
          occurredAt: finishedAt,
        });

        inboundMessage = inboundMessage.markProcessed(finishedAt);
        await this.messageRepository.updateStatus(
          inboundMessage.id!,
          inboundMessage.toObject().status,
          finishedAt,
        );

        const outboundMessage = await this.traceService.runInChildSpan(
          traceId,
          'omnichannel.outbound.persist',
          async () =>
            this.messageRepository.create(
              OmnichannelMessage.createOutbound({
                externalMessageId: null,
                conversationId: inboundMessage.toObject().conversationId,
                channel: inboundMessage.channel,
                senderId: null,
                senderName: 'rag-platform',
                senderAddress: inboundMessage.toObject().recipientAddress,
                recipientAddress: inboundMessage.toObject().senderAddress,
                subject: inboundMessage.toObject().subject,
                body: safeResponseText,
                normalizedText: safeResponseText,
                metadata: {
                  correlationId,
                  policyRejected: true,
                  policyReason: aiUsagePolicy.reason ?? 'UNKNOWN',
                },
              }),
            ),
        );

        const dispatchEnabled = this.configService.get<boolean>(
          'omnichannel.autoResponse',
          true,
        );
        const dispatchResult = dispatchEnabled
          ? await this.outboundDispatcher.dispatch({
              message: outboundMessage,
              channel: outboundMessage.channel,
              correlationId,
            })
          : { accepted: false };

        if (dispatchResult.accepted) {
          await this.messageRepository.updateStatus(
            outboundMessage.id!,
            outboundMessage.markDispatched(finishedAt).toObject().status,
            finishedAt,
          );
        }

        await this.executionRepository.finishSuccess(
          execution.succeed({
            usedRag: false,
            ragQuery: null,
            modelName: 'policy-guard',
            inputTokens: 0,
            outputTokens: 0,
            latencyMs,
            finishedAt,
          }),
        );
        await this.executionService.logEvent({
          executionId: trackedExecution.id,
          eventName: ExecutionEventName.RESPONSE_SENT,
          metadata: {
            channel: inboundMessage.channel,
            outboundMessageId: outboundMessage.id,
            dispatchAccepted: dispatchResult.accepted,
            policyRejected: true,
          },
          occurredAt: finishedAt,
        });
        await this.executionService.completeExecution({
          executionId: trackedExecution.id,
          finishedAt,
          status: OmnichannelExecutionStatus.SUCCESS,
        });
        await this.metricSnapshotRepository.refreshDailySnapshot(
          inboundMessage.channel,
        );
        this.metricsService.recordRequest(inboundMessage.channel, 'success');
        this.metricsService.observeLatency(inboundMessage.channel, latencyMs);
        this.logger.warn(
          {
            correlationId,
            traceId,
            channel: inboundMessage.channel,
            messageId: inboundMessage.id,
            executionId: execution.id,
            reason: aiUsagePolicy.reason,
          },
          'AI usage policy rejected the request before agent execution',
        );

        return {
          correlationId,
          traceId,
          messageId: inboundMessage.id,
          outboundMessageId: outboundMessage.id,
          executionId: execution.id,
          usedRag: false,
          responseText: safeResponseText,
          dispatchAccepted: dispatchResult.accepted,
        };
      }

      await this.executionService.logEvent({
        executionId: trackedExecution.id,
        eventName: ExecutionEventName.AI_POLICY_PASSED,
        metadata: {
          channel: inboundMessage.channel,
          estimatedPromptTokens: aiUsagePolicy.estimatedPromptTokens,
          maxPromptTokens: aiUsagePolicy.maxPromptTokens,
          maxCompletionTokens: aiUsagePolicy.maxCompletionTokens,
        },
      });

      const agentResult = await this.traceService.runInChildSpan(
        traceId,
        'omnichannel.agent.execute',
        async () => {
          await this.executionService.logEvent({
            executionId: trackedExecution.id,
            eventName: ExecutionEventName.AGENT_EXECUTION_STARTED,
            metadata: {
              channel: inboundMessage.channel,
              agentName: this.configService.get<string>(
                'omnichannel.defaultAgent',
                'rag-agent',
              ),
              maxPromptTokens: aiUsagePolicy.maxPromptTokens,
              maxCompletionTokens: aiUsagePolicy.maxCompletionTokens,
            },
          });

          const result = await this.agentExecutor.execute(
            this.buildAgentExecutionRequest(
              inboundMessage,
              correlationId,
              traceId,
              ragDecision,
              ragResult,
              aiUsagePolicy.maxPromptTokens,
              aiUsagePolicy.maxCompletionTokens,
            ),
          );

          await this.executionService.logEvent({
            executionId: trackedExecution.id,
            eventName: ExecutionEventName.AGENT_EXECUTION_COMPLETED,
            metadata: {
              channel: inboundMessage.channel,
              modelName: result.modelName,
              usedRag: result.usedRag,
              inputTokens: result.inputTokens,
              outputTokens: result.outputTokens,
            },
          });

          return result;
        },
      );

      this.aiUsagePolicyService.recordExecution(
        inboundMessage,
        agentResult.inputTokens,
        agentResult.outputTokens,
      );

      const finishedAt = this.clockService.now();
      const latencyMs = finishedAt.getTime() - startedAt.getTime();
      execution = await this.executionRepository.finishSuccess(
        execution.succeed({
          usedRag: agentResult.usedRag,
          ragQuery: agentResult.ragQuery,
          modelName: agentResult.modelName,
          inputTokens: agentResult.inputTokens,
          outputTokens: agentResult.outputTokens,
          latencyMs,
          finishedAt,
        }),
      );

      inboundMessage = inboundMessage.markProcessed(finishedAt);
      await this.messageRepository.updateStatus(
        inboundMessage.id!,
        inboundMessage.toObject().status,
        finishedAt,
      );

      const outboundMessage = await this.traceService.runInChildSpan(
        traceId,
        'omnichannel.outbound.persist',
        async () =>
          this.messageRepository.create(
            OmnichannelMessage.createOutbound({
              externalMessageId: null,
              conversationId: inboundMessage.toObject().conversationId,
              channel: inboundMessage.channel,
              senderId: null,
              senderName: 'rag-platform',
              senderAddress: inboundMessage.toObject().recipientAddress,
              recipientAddress: inboundMessage.toObject().senderAddress,
              subject: inboundMessage.toObject().subject,
              body: agentResult.responseText,
              normalizedText: agentResult.responseText,
              metadata: {
                correlationId,
                modelName: agentResult.modelName,
                usedRag: agentResult.usedRag,
              },
            }),
          ),
      );

      const dispatchEnabled = this.configService.get<boolean>(
        'omnichannel.autoResponse',
        true,
      );
      const dispatchResult = dispatchEnabled
        ? await this.outboundDispatcher.dispatch({
            message: outboundMessage,
            channel: outboundMessage.channel,
            correlationId,
          })
        : { accepted: false };

      if (dispatchResult.accepted) {
        await this.messageRepository.updateStatus(
          outboundMessage.id!,
          outboundMessage.markDispatched(finishedAt).toObject().status,
          finishedAt,
        );
      }

      await this.executionService.logEvent({
        executionId: trackedExecution.id,
        eventName: ExecutionEventName.RESPONSE_SENT,
        metadata: {
          channel: inboundMessage.channel,
          outboundMessageId: outboundMessage.id,
          dispatchAccepted: dispatchResult.accepted,
        },
        occurredAt: finishedAt,
      });
      await this.executionService.completeExecution({
        executionId: trackedExecution.id,
        finishedAt,
        status: OmnichannelExecutionStatus.SUCCESS,
      });

      await this.metricSnapshotRepository.refreshDailySnapshot(
        inboundMessage.channel,
      );
      this.metricsService.recordRequest(inboundMessage.channel, 'success');
      this.metricsService.observeLatency(inboundMessage.channel, latencyMs);

      this.logger.info(
        {
          correlationId,
          traceId,
          channel: inboundMessage.channel,
          messageId: inboundMessage.id,
          executionId: execution.id,
          status: execution.toObject().status,
          latencyMs,
        },
        'Omnichannel message processed successfully',
      );

      return {
        correlationId,
        traceId,
        messageId: inboundMessage.id,
        outboundMessageId: outboundMessage.id,
        executionId: execution.id,
        usedRag: agentResult.usedRag,
        responseText: agentResult.responseText,
        dispatchAccepted: dispatchResult.accepted,
      };
    } catch (error) {
      const finishedAt = this.clockService.now();
      const latencyMs = finishedAt.getTime() - startedAt.getTime();
      const status =
        error instanceof Error && error.message.includes('timeout')
          ? OmnichannelExecutionStatus.TIMEOUT
          : OmnichannelExecutionStatus.FAILED;

      await this.executionRepository.finishFailure(
        execution.fail({
          errorMessage:
            error instanceof Error
              ? error.message
              : 'Unknown omnichannel error',
          latencyMs,
          finishedAt,
          status,
        }),
      );
      await this.executionService.logEvent({
        executionId: trackedExecution.id,
        eventName: ExecutionEventName.ERROR,
        metadata: {
          channel: inboundMessage.channel,
          message:
            error instanceof Error
              ? error.message
              : 'Unknown omnichannel error',
          status,
        },
        occurredAt: finishedAt,
      });
      await this.executionService.failExecution({
        executionId: trackedExecution.id,
        errorMessage:
          error instanceof Error ? error.message : 'Unknown omnichannel error',
        finishedAt,
        status,
      });
      await this.messageRepository.updateStatus(
        inboundMessage.id!,
        OmnichannelMessageStatus.FAILED,
        finishedAt,
      );
      await this.metricSnapshotRepository.refreshDailySnapshot(
        inboundMessage.channel,
      );
      this.metricsService.recordRequest(inboundMessage.channel, 'error');
      this.metricsService.observeLatency(inboundMessage.channel, latencyMs);
      this.metricsService.recordFailure(inboundMessage.channel);

      this.logger.error(
        {
          err: error,
          correlationId,
          traceId,
          channel: inboundMessage.channel,
          messageId: inboundMessage.id,
          executionId: execution.id,
          status,
          latencyMs,
        },
        'Omnichannel message processing failed',
      );

      throw new ServiceUnavailableException('Omnichannel orchestrator failed');
    }
  }

  private buildAgentExecutionRequest(
    message: OmnichannelMessage,
    correlationId: string,
    traceId: string,
    ragDecision: RagDecisionResult,
    ragResult: Awaited<ReturnType<IRagGateway['query']>> | null,
    maxPromptTokens: number,
    maxCompletionTokens: number,
  ): AgentExecutionRequest {
    return {
      message,
      channel: message.channel,
      correlationId,
      traceId,
      agentName: this.configService.get<string>(
        'omnichannel.defaultAgent',
        'rag-agent',
      ),
      maxPromptTokens,
      maxCompletionTokens,
      ragResult: ragDecision.useRag ? ragResult : null,
    };
  }

  private buildAiPolicyRejectionMessage(
    reason?:
      | 'MESSAGE_TOO_LONG'
      | 'TOKEN_LIMIT_EXCEEDED'
      | 'RATE_LIMIT_EXCEEDED',
  ): string {
    switch (reason) {
      case 'MESSAGE_TOO_LONG':
        return 'Your request exceeded the maximum supported message size. Please shorten the message and try again.';
      case 'TOKEN_LIMIT_EXCEEDED':
        return 'Your request exceeded the current AI prompt size limit. Please simplify the request and try again.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'You have reached the current AI request rate limit for this channel. Please wait a moment and try again.';
      default:
        return 'Your request could not be processed because it exceeded the current AI usage policy limits.';
    }
  }
}
