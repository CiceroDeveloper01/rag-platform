import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Channel } from "@rag-platform/contracts";
import {
  AppLoggerService,
  INBOUND_MESSAGES_TOTAL,
  MetricsService,
  TELEGRAM_AGENT_EXECUTIONS_TOTAL,
  TELEGRAM_JOBS_PROCESSED_TOTAL,
} from "@rag-platform/observability";
import { Job, Worker } from "bullmq";
import { AgentTracePublisherService } from "../agent-trace/agent-trace.publisher";
import { AnalyticsPublisherService } from "../analytics/analytics.service";
import { AgentGraphService } from "../agents/agent.graph";
import { CostCalculatorService } from "../cost-monitoring/cost-calculator.service";
import { TokenCounterService } from "../cost-monitoring/token-counter.service";
import { UsageRepository } from "../cost-monitoring/usage.repository";
import { EvaluationMetrics } from "../evaluation/evaluation.metrics";
import { EvaluationRepository } from "../evaluation/evaluation.repository";
import { ResponseEvaluatorService } from "../evaluation/response-evaluator.service";
import { ActionValidatorService } from "../guardrails/action-validator.service";
import { OutputFilterService } from "../guardrails/output-filter.service";
import { PolicyEngineService } from "../guardrails/policy-engine.service";
import { PromptInjectionGuard } from "../guardrails/prompt-injection.guard";
import { DeadLetterQueueService } from "../queue/dead-letter.queue";
import { FlowExecutionQueueService } from "../queue/flow-execution.queue";
import { TenantContextMiddleware } from "../tenancy/tenant-context.middleware";
import {
  EMAIL_RECEIVED_JOB,
  INBOUND_MESSAGES_QUEUE,
  TELEGRAM_RECEIVED_JOB,
  WHATSAPP_RECEIVED_JOB,
} from "../queue/queue.constants";
import { InboundMessagePayload } from "../queue/inbound-message.types";

const SUPPORTED_JOBS = new Set([
  EMAIL_RECEIVED_JOB,
  TELEGRAM_RECEIVED_JOB,
  WHATSAPP_RECEIVED_JOB,
]);

@Injectable()
export class InboundMessageProcessor implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker<InboundMessagePayload>;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
    private readonly metricsService: MetricsService,
    private readonly agentTracePublisherService: AgentTracePublisherService,
    private readonly analyticsPublisherService: AnalyticsPublisherService,
    private readonly tenantContextMiddleware: TenantContextMiddleware,
    private readonly tokenCounterService: TokenCounterService,
    private readonly costCalculatorService: CostCalculatorService,
    private readonly usageRepository: UsageRepository,
    private readonly responseEvaluatorService: ResponseEvaluatorService,
    private readonly evaluationRepository: EvaluationRepository,
    private readonly evaluationMetrics: EvaluationMetrics,
    private readonly promptInjectionGuard: PromptInjectionGuard,
    private readonly policyEngineService: PolicyEngineService,
    private readonly actionValidatorService: ActionValidatorService,
    private readonly outputFilterService: OutputFilterService,
    private readonly agentGraphService: AgentGraphService,
    private readonly flowExecutionQueueService: FlowExecutionQueueService,
    private readonly deadLetterQueueService: DeadLetterQueueService,
  ) {}

  onModuleInit(): void {
    const queueName =
      this.configService.get<string>(
        "queue.inbound.name",
        INBOUND_MESSAGES_QUEUE,
      ) ?? INBOUND_MESSAGES_QUEUE;
    const concurrency =
      this.configService.get<number>("queue.inbound.concurrency", 5) ?? 5;

    this.worker = new Worker<InboundMessagePayload>(
      queueName,
      async (job: Job<InboundMessagePayload>) => this.handleJob(job),
      {
        concurrency,
        connection: {
          host: this.configService.get<string>("queue.redis.host", "localhost"),
          port:
            this.configService.get<number>("queue.redis.port", 6379) ?? 6379,
          db: this.configService.get<number>("queue.redis.db", 0) ?? 0,
          password:
            this.configService.get<string>("queue.redis.password") || undefined,
        },
      },
    );

    this.worker.on("failed", (job, error) => {
      if (!job) {
        return;
      }

      const configuredAttempts =
        typeof job.opts.attempts === "number"
          ? job.opts.attempts
          : (this.configService.get<number>("queue.inbound.attempts", 3) ?? 3);
      const isFinalFailure = job.attemptsMade >= configuredAttempts;

      this.logger.error(
        "Inbound job failed",
        error?.stack,
        InboundMessageProcessor.name,
        {
          jobId: job.id,
          jobName: job.name,
          attemptsMade: job.attemptsMade,
          configuredAttempts,
          isFinalFailure,
          externalMessageId: job.data?.externalMessageId,
          channel: job.data?.channel,
        },
      );
      this.metricsService.increment("inbound_job_failures_total");

      if (!isFinalFailure) {
        return;
      }

      void this.deadLetterQueueService.enqueueInboundFailure({
        queueName:
          this.configService.get<string>(
            "queue.inbound.name",
            INBOUND_MESSAGES_QUEUE,
          ) ?? INBOUND_MESSAGES_QUEUE,
        jobName: job.name,
        jobId: typeof job.id === "string" ? job.id : String(job.id ?? ""),
        failedAt: new Date().toISOString(),
        attemptsMade: job.attemptsMade,
        error: {
          message: error?.message ?? "unknown_inbound_failure",
          stack: error?.stack,
        },
        payload: job.data,
      });
      this.metricsService.increment("inbound_job_dlq_total");
    });

    this.logger.log(
      "Inbound message processor started",
      InboundMessageProcessor.name,
      { queueName, concurrency },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }

  async handleJob(
    job: Pick<
      Job<InboundMessagePayload>,
      "name" | "data" | "id" | "attemptsMade" | "opts"
    >,
  ): Promise<void> {
    if (!SUPPORTED_JOBS.has(job.name)) {
      this.logger.warn(
        "Ignoring unsupported inbound job",
        InboundMessageProcessor.name,
        { jobName: job.name },
      );
      return;
    }

    this.logger.log(
      "Inbound message received by processor",
      InboundMessageProcessor.name,
      {
        jobName: job.name,
        channel: job.data.channel,
        externalMessageId: job.data.externalMessageId,
      },
    );
    const tenantContext = this.tenantContextMiddleware.attach({
      metadata: job.data.metadata ?? {},
    });
    const inboundMessage: InboundMessagePayload = {
      ...job.data,
      metadata: {
        ...(job.data.metadata ?? {}),
        tenantId: tenantContext.tenantId,
      },
    };

    this.metricsService.increment(INBOUND_MESSAGES_TOTAL);
    if (inboundMessage.channel === Channel.TELEGRAM) {
      this.metricsService.increment(TELEGRAM_JOBS_PROCESSED_TOTAL);
    }
    this.promptInjectionGuard.assertSafe(inboundMessage);

    const traceId = `${job.data.channel}:${job.data.externalMessageId}`;
    await this.agentTracePublisherService.publish({
      traceId,
      timestamp: new Date().toISOString(),
      step: "agent_trace_started",
      data: {
        channel: inboundMessage.channel,
        externalMessageId: inboundMessage.externalMessageId,
        from: inboundMessage.from,
        subject: inboundMessage.subject,
        body: inboundMessage.body,
        attachments: (inboundMessage.attachments ?? []).length,
        tenantId: tenantContext.tenantId,
      },
    });

    if (inboundMessage.channel === Channel.TELEGRAM) {
      await this.agentTracePublisherService.publish({
        traceId,
        timestamp: new Date().toISOString(),
        step: "telegram_job_processing",
        data: {
          externalMessageId: inboundMessage.externalMessageId,
          conversationId: inboundMessage.conversationId,
          tenantId: tenantContext.tenantId,
        },
      });
    }

    const { decision, executionRequest, durationMs } =
      await this.agentGraphService.execute(inboundMessage);

    await this.analyticsPublisherService.publish({
      eventType: "analytics.message.received",
      timestamp: new Date().toISOString(),
      channel: inboundMessage.channel,
      language: decision.detectedLanguage,
      keywords: extractKeywords(inboundMessage.body),
      tenantId: tenantContext.tenantId,
    });

    await this.analyticsPublisherService.publish({
      eventType: "analytics.agent.selected",
      timestamp: new Date().toISOString(),
      channel: inboundMessage.channel,
      language: decision.detectedLanguage,
      agent: decision.targetAgent,
      keywords: extractKeywords(inboundMessage.body),
      tenantId: tenantContext.tenantId,
    });
    await this.agentTracePublisherService.publish({
      traceId,
      timestamp: new Date().toISOString(),
      step: "agent_routed",
      data: {
        channel: inboundMessage.channel,
        targetAgent: decision.targetAgent,
        intent: decision.intent,
        confidence: decision.confidence,
        reasoning: buildReasoning(
          decision,
          executionRequest.payload.context,
          decision.detectedLanguage,
        ),
        tenantId: tenantContext.tenantId,
      },
    });

    if (inboundMessage.channel === Channel.TELEGRAM) {
      this.metricsService.increment(TELEGRAM_AGENT_EXECUTIONS_TOTAL);
      await this.agentTracePublisherService.publish({
        traceId,
        timestamp: new Date().toISOString(),
        step: "telegram_agent_execution",
        data: {
          externalMessageId: inboundMessage.externalMessageId,
          targetAgent: decision.targetAgent,
          flowJobName: executionRequest.jobName,
          tenantId: tenantContext.tenantId,
        },
      });
    }

    this.policyEngineService.assertAuthorized(
      decision.targetAgent,
      executionRequest.jobName,
    );
    this.actionValidatorService.assertValid(executionRequest.payload);

    const llmContext = executionRequest.payload.context?.["llmContext"] as
      | string
      | undefined;
    const aiUsage = executionRequest.payload.context?.["aiUsage"] as
      | { usedRag?: boolean; usedLlm?: boolean }
      | undefined;
    const retrievedDocuments = executionRequest.payload.context?.[
      "retrievedDocuments"
    ] as Array<Record<string, unknown>> | undefined;
    if (retrievedDocuments) {
      await this.agentTracePublisherService.publish({
        traceId,
        timestamp: new Date().toISOString(),
        step: "rag_retrieval",
        data: {
          retrievedCount: retrievedDocuments.length,
          sources: retrievedDocuments.map((document) => document.source),
          preview: retrievedDocuments.slice(0, 3),
          tenantId: tenantContext.tenantId,
        },
      });
    }

    await this.agentTracePublisherService.publish({
      traceId,
      timestamp: new Date().toISOString(),
      step: "tool_called",
      data: {
        tool: executionRequest.jobName,
        payloadSummary: {
          channel: executionRequest.payload.channel,
          externalMessageId: executionRequest.payload.externalMessageId,
        },
        tenantId: tenantContext.tenantId,
      },
    });

    const shouldEvaluateLlmOutput =
      (aiUsage?.usedLlm ?? llmContext !== undefined) && !!llmContext;

    if (shouldEvaluateLlmOutput) {
      if (this.isEvaluationEnabled()) {
        this.outputFilterService.assertSafe(llmContext, {
          externalMessageId: inboundMessage.externalMessageId,
          channel: inboundMessage.channel,
          agent: decision.targetAgent,
          action: executionRequest.jobName,
        });

        const evaluation = this.responseEvaluatorService.evaluateResponse(
          inboundMessage.body,
          llmContext,
          executionRequest.payload.context,
        );

        this.evaluationRepository.saveEvaluation({
          responseId: inboundMessage.externalMessageId,
          question: inboundMessage.body,
          response: llmContext,
          context: executionRequest.payload.context,
          createdAt: new Date().toISOString(),
          ...evaluation,
        });
        await this.agentTracePublisherService.publish({
          traceId,
          timestamp: new Date().toISOString(),
          step: "response_generated",
          data: {
            agent: decision.targetAgent,
            responsePreview: llmContext.slice(0, 400),
            contextSections: Object.keys(
              executionRequest.payload.context ?? {},
            ),
            tenantId: tenantContext.tenantId,
          },
        });

        const model = "gpt-4o-mini";
        const tokensInput = this.tokenCounterService.countInputTokens(
          `${inboundMessage.body}\n\n${llmContext}`,
        );
        const tokensOutput =
          this.tokenCounterService.countOutputTokens(llmContext);
        const cost = this.costCalculatorService.calculateCost(
          model,
          tokensInput + tokensOutput,
        );
        this.usageRepository.save({
          tenantId: tenantContext.tenantId,
          agentName: decision.targetAgent,
          tokensInput,
          tokensOutput,
          cost,
          model,
          timestamp: new Date().toISOString(),
        });

        const qualityMetrics = this.evaluationMetrics.getAgentQuality();
        await this.analyticsPublisherService.publish({
          eventType: "analytics.agent.quality",
          timestamp: new Date().toISOString(),
          channel: inboundMessage.channel,
          agent: decision.targetAgent,
          averageQualityScore: qualityMetrics.averageQualityScore,
          failureRate: qualityMetrics.failureRate,
          tenantId: tenantContext.tenantId,
        });
        await this.analyticsPublisherService.publish({
          eventType: "analytics.ai.cost",
          timestamp: new Date().toISOString(),
          channel: inboundMessage.channel,
          tenantId: tenantContext.tenantId,
          agent: decision.targetAgent,
          model,
          totalCost: cost,
          tokensInput,
          tokensOutput,
          costByAgent: this.usageRepository.summarizeByAgent(),
          costByTenant: this.usageRepository.summarizeByTenant(),
        });
        await this.analyticsPublisherService.publish({
          eventType: "analytics.tenant.usage",
          timestamp: new Date().toISOString(),
          channel: inboundMessage.channel,
          tenantId: tenantContext.tenantId,
          costByTenant: this.usageRepository.summarizeByTenant(),
        });
        await this.agentTracePublisherService.publish({
          traceId,
          timestamp: new Date().toISOString(),
          step: "evaluation_completed",
          data: {
            relevanceScore: evaluation.relevanceScore,
            coherenceScore: evaluation.coherenceScore,
            safetyScore: evaluation.safetyScore,
            averageQualityScore: qualityMetrics.averageQualityScore,
            failureRate: qualityMetrics.failureRate,
            tenantId: tenantContext.tenantId,
            cost,
            tokensInput,
            tokensOutput,
          },
        });
      } else {
        this.metricsService.increment("evaluation_skipped_total");
        this.logger.warn(
          "Evaluation skipped because the feature toggle is disabled",
          InboundMessageProcessor.name,
          {
            externalMessageId: inboundMessage.externalMessageId,
            channel: inboundMessage.channel,
            targetAgent: decision.targetAgent,
          },
        );
        await this.agentTracePublisherService.publish({
          traceId,
          timestamp: new Date().toISOString(),
          step: "evaluation_skipped",
          data: {
            agent: decision.targetAgent,
            tenantId: tenantContext.tenantId,
          },
        });
      }
    }

    this.logger.log(
      "Publishing flow execution request",
      InboundMessageProcessor.name,
      {
        externalMessageId: inboundMessage.externalMessageId,
        targetAgent: decision.targetAgent,
        flowJobName: executionRequest.jobName,
        durationMs,
      },
    );

    await this.flowExecutionQueueService.enqueue(
      executionRequest.jobName,
      executionRequest.payload,
    );

    await this.analyticsPublisherService.publish({
      eventType: "analytics.flow.executed",
      timestamp: new Date().toISOString(),
      channel: inboundMessage.channel,
      language: decision.detectedLanguage,
      agent: decision.targetAgent,
      flow: executionRequest.jobName,
      keywords: extractKeywords(inboundMessage.body),
      tenantId: tenantContext.tenantId,
    });
  }

  private isEvaluationEnabled(): boolean {
    return (
      this.configService.get<boolean>("features.evaluationEnabled", true) ??
      true
    );
  }
}

function buildReasoning(
  decision: {
    targetAgent: string;
    intent: string;
    confidence: number;
  },
  context?: Record<string, unknown>,
  language: "pt" | "en" | "es" = "pt",
): string {
  const retrievedDocuments = Array.isArray(context?.retrievedDocuments)
    ? context.retrievedDocuments.length
    : 0;
  const attachments = Array.isArray(context?.attachments)
    ? context.attachments.length
    : 0;

  switch (language) {
    case "en":
      return `Intent ${decision.intent} routed to ${decision.targetAgent} with confidence ${decision.confidence}. Attachments: ${attachments}. Retrieved documents: ${retrievedDocuments}.`;
    case "es":
      return `La intencion ${decision.intent} fue dirigida a ${decision.targetAgent} con confianza ${decision.confidence}. Adjuntos: ${attachments}. Documentos recuperados: ${retrievedDocuments}.`;
    case "pt":
    default:
      return `A intencao ${decision.intent} foi encaminhada para ${decision.targetAgent} com confianca ${decision.confidence}. Anexos: ${attachments}. Documentos recuperados: ${retrievedDocuments}.`;
  }
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 4)
    .filter((word, index, allWords) => allWords.indexOf(word) === index)
    .slice(0, 6);
}
