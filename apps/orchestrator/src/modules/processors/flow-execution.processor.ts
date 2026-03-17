import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AttachmentPayload,
  Channel,
  ChannelMessageEvent,
  DocumentPayload,
  MessageType,
} from "@rag-platform/contracts";
import {
  AppLoggerService,
  MetricsService,
  TELEGRAM_RESPONSES_SENT_TOTAL,
} from "@rag-platform/observability";
import { DocumentIngestionInternalClient } from "@rag-platform/sdk";
import { Job, Worker } from "bullmq";
import { AgentTracePublisherService } from "../agent-trace/agent-trace.publisher";
import { ChannelOutboundRouterService } from "../channels/core/router/channel-outbound-router.service";
import { TelegramResponseComposerService } from "../channels/telegram/composer/telegram-response-composer.service";
import { DeadLetterQueueService } from "../queue/dead-letter.queue";
import {
  EXECUTE_REGISTER_DOCUMENT_JOB,
  EXECUTE_REPLY_CONVERSATION_JOB,
  FLOW_EXECUTION_QUEUE,
} from "../queue/queue.constants";
import { FlowExecutionPayload } from "../queue/flow-execution.types";
import { DownloadFileToolService } from "../tools/document-ingestion/download-file.tool";

@Injectable()
export class FlowExecutionProcessor implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker<FlowExecutionPayload>;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
    private readonly metricsService: MetricsService,
    private readonly agentTracePublisherService: AgentTracePublisherService,
    private readonly telegramResponseComposerService: TelegramResponseComposerService,
    private readonly channelOutboundRouterService: ChannelOutboundRouterService,
    private readonly downloadFileToolService: DownloadFileToolService,
    private readonly documentIngestionInternalClient: DocumentIngestionInternalClient,
    private readonly deadLetterQueueService: DeadLetterQueueService,
  ) {}

  onModuleInit(): void {
    const queueName =
      this.configService.get<string>(
        "queue.flowExecution.name",
        FLOW_EXECUTION_QUEUE,
      ) ?? FLOW_EXECUTION_QUEUE;
    const concurrency =
      this.configService.get<number>("queue.flowExecution.concurrency", 5) ?? 5;

    this.worker = new Worker<FlowExecutionPayload>(
      queueName,
      async (job: Job<FlowExecutionPayload>) => this.handleJob(job),
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
          : (this.configService.get<number>(
              "queue.flowExecution.attempts",
              3,
            ) ?? 3);
      const isFinalFailure = job.attemptsMade >= configuredAttempts;

      this.logger.error(
        "Flow execution job failed",
        error?.stack,
        FlowExecutionProcessor.name,
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

      if (!isFinalFailure) {
        return;
      }

      void this.deadLetterQueueService.enqueueFlowExecutionFailure({
        queueName,
        jobName: job.name,
        jobId: typeof job.id === "string" ? job.id : String(job.id ?? ""),
        failedAt: new Date().toISOString(),
        attemptsMade: job.attemptsMade,
        error: {
          message: error?.message ?? "unknown_flow_execution_failure",
          stack: error?.stack,
        },
        payload: job.data,
      });
    });

    this.logger.log(
      "Flow execution processor started",
      FlowExecutionProcessor.name,
      { queueName, concurrency },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }

  async handleJob(
    job: Pick<Job<FlowExecutionPayload>, "name" | "data" | "id">,
  ): Promise<void> {
    if (
      job.name !== EXECUTE_REPLY_CONVERSATION_JOB &&
      job.name !== EXECUTE_REGISTER_DOCUMENT_JOB
    ) {
      this.logger.warn(
        "Ignoring unsupported flow execution job",
        FlowExecutionProcessor.name,
        {
          jobName: job.name,
        },
      );
      return;
    }

    if (job.name === EXECUTE_REGISTER_DOCUMENT_JOB) {
      await this.handleRegisterDocument(job.data);
      return;
    }

    const responseText = this.telegramResponseComposerService.compose(job.data);
    const recipientId = this.telegramResponseComposerService.resolveRecipientId(
      job.data,
    );
    const traceId = `${job.data.channel}:${job.data.externalMessageId}`;
    const tenantId = extractTenantId(job.data);

    await this.sendOutboundMessage(
      job.data.channel,
      {
        recipientId,
        text: responseText,
        metadata: {
          externalMessageId: job.data.externalMessageId,
          tenantId,
        },
      },
      {
        traceId,
        tenantId,
        externalMessageId: job.data.externalMessageId,
        responseText,
      },
    );
  }

  private async handleRegisterDocument(
    payload: FlowExecutionPayload,
  ): Promise<void> {
    const message = toChannelMessageEvent(payload);
    const downloaded = await this.downloadFileToolService.execute({
      message,
    });
    const content =
      downloaded.extractedText ?? downloaded.bodyFallback ?? downloaded.fileName;
    const tenantId = extractTenantId(payload);
    const normalizedMimeType = resolveAsyncDocumentMimeType(
      downloaded.mimeType,
      content,
    );
    const normalizedFilename = normalizeAsyncDocumentFilename(
      downloaded.fileName,
      normalizedMimeType,
    );
    const result = await this.documentIngestionInternalClient.requestIngestion<{
      documentId: number;
      status: string;
    }>({
      tenantId,
      sourceChannel: String(payload.channel),
      conversationId: message.conversationId,
      filename: normalizedFilename,
      mimeType: normalizedMimeType,
      fileContentBase64: Buffer.from(content, "utf-8").toString("base64"),
      metadata: sanitizeStringMetadata({
        ...((payload.context?.metadata as Record<string, unknown> | undefined) ??
          {}),
        providerFileId: downloaded.providerFileId,
        originalMimeType: downloaded.mimeType,
        externalMessageId: payload.externalMessageId,
      }),
    });
    const recipientId = resolveRecipientId(payload);

    if (recipientId) {
      await this.sendOutboundMessage(
        payload.channel,
        {
          recipientId,
          text: buildDocumentIndexedResponse(
            downloaded.fileName,
            result.status ?? "PENDING",
          ),
          metadata: {
            documentId: result.documentId,
            tenantId,
          },
        },
        {
          traceId: `${payload.channel}:${payload.externalMessageId}`,
          tenantId,
          externalMessageId: payload.externalMessageId,
          responseText: buildDocumentIndexedResponse(
            downloaded.fileName,
            result.status ?? "PENDING",
          ),
        },
      );
    }
  }

  private async sendOutboundMessage(
    channel: Channel,
    payload: {
      recipientId: string | null;
      text: string;
      metadata: Record<string, unknown>;
    },
    context: {
      traceId: string;
      tenantId: string;
      externalMessageId: string;
      responseText: string;
    },
  ): Promise<void> {
    if (!this.isOutboundSendingEnabled()) {
      this.metricsService.increment("outbound_messages_skipped_total");
      this.logger.warn(
        "Outbound delivery skipped because the feature toggle is disabled",
        FlowExecutionProcessor.name,
        {
          channel,
          externalMessageId: context.externalMessageId,
          recipientId: payload.recipientId,
        },
      );
      await this.agentTracePublisherService.publish({
        traceId: context.traceId,
        timestamp: new Date().toISOString(),
        step: "outbound_delivery_skipped",
        data: {
          channel,
          recipientId: payload.recipientId,
          tenantId: context.tenantId,
        },
      });
      return;
    }

    if (!payload.recipientId) {
      this.metricsService.increment("outbound_messages_skipped_total");
      this.logger.warn(
        "Outbound delivery skipped because no recipient could be resolved",
        FlowExecutionProcessor.name,
        {
          channel,
          externalMessageId: context.externalMessageId,
        },
      );
      await this.agentTracePublisherService.publish({
        traceId: context.traceId,
        timestamp: new Date().toISOString(),
        step: "outbound_delivery_skipped",
        data: {
          channel,
          tenantId: context.tenantId,
          reason: "missing_recipient",
        },
      });
      return;
    }

    const outboundMessage = {
      recipientId: payload.recipientId,
      text: payload.text,
      metadata: payload.metadata,
    };

    await this.channelOutboundRouterService.send(channel, outboundMessage);

    this.metricsService.increment(TELEGRAM_RESPONSES_SENT_TOTAL);
    this.logger.log("Telegram response sent", FlowExecutionProcessor.name, {
      externalMessageId: context.externalMessageId,
      recipientId: payload.recipientId,
    });
    await this.agentTracePublisherService.publish({
      traceId: context.traceId,
      timestamp: new Date().toISOString(),
      step: "telegram_response_sent",
      data: {
        recipientId: payload.recipientId,
        responsePreview: context.responseText.slice(0, 400),
        tenantId: context.tenantId,
      },
    });
  }

  private isOutboundSendingEnabled(): boolean {
    return (
      this.configService.get<boolean>(
        "features.outboundSendingEnabled",
        true,
      ) ?? true
    );
  }
}

function extractTenantId(payload: FlowExecutionPayload): string {
  const metadata = payload.context?.metadata as
    | Record<string, unknown>
    | undefined;
  return typeof metadata?.tenantId === "string"
    ? metadata.tenantId
    : "default-tenant";
}

function resolveRecipientId(payload: FlowExecutionPayload): string | null {
  const metadata = payload.context?.metadata as
    | Record<string, unknown>
    | undefined;
  const candidate =
    metadata?.telegramChatId ??
    payload.context?.chatId ??
    payload.context?.conversationId ??
    payload.context?.from;

  if (typeof candidate === "string" || typeof candidate === "number") {
    return String(candidate);
  }

  return null;
}

function toChannelMessageEvent(
  payload: FlowExecutionPayload,
): ChannelMessageEvent {
  const context = (payload.context ?? {}) as Record<string, unknown>;
  const messageType: MessageType =
    context.messageType === "document" ||
    context.messageType === "command" ||
    context.messageType === "text"
      ? context.messageType
      : "text";
  return {
    eventType: "message.received",
    channel: payload.channel,
    externalMessageId: payload.externalMessageId,
    conversationId:
      typeof context.conversationId === "string"
        ? context.conversationId
        : undefined,
    from: typeof context.from === "string" ? context.from : "unknown",
    userId: typeof context.userId === "string" ? context.userId : undefined,
    chatId: typeof context.chatId === "string" ? context.chatId : undefined,
    messageId:
      typeof context.messageId === "string" ? context.messageId : undefined,
    messageType,
    text: typeof context.text === "string" ? context.text : undefined,
    document:
      typeof context.document === "object" && context.document !== null
        ? (context.document as DocumentPayload)
        : undefined,
    subject: typeof context.subject === "string" ? context.subject : undefined,
    body: typeof context.body === "string" ? context.body : "",
    attachments: Array.isArray(context.attachments)
      ? (context.attachments as AttachmentPayload[])
      : undefined,
    receivedAt:
      typeof context.receivedAt === "string"
        ? context.receivedAt
        : new Date().toISOString(),
    metadata:
      typeof context.metadata === "object" && context.metadata !== null
        ? (context.metadata as Record<string, unknown>)
        : undefined,
  };
}

function buildDocumentIndexedResponse(
  fileName: string,
  status: string,
): string {
  return `Document "${fileName}" was received and queued for asynchronous ingestion. Current status: ${status}.`;
}

function resolveAsyncDocumentMimeType(
  originalMimeType: string,
  content: string,
): string {
  if (originalMimeType.startsWith("text/")) {
    return originalMimeType;
  }

  return content.trim().length > 0 ? "text/plain" : originalMimeType;
}

function normalizeAsyncDocumentFilename(
  fileName: string,
  mimeType: string,
): string {
  if (mimeType !== "text/plain") {
    return fileName;
  }

  if (/\.(txt|md)$/i.test(fileName)) {
    return fileName;
  }

  return `${fileName}.txt`;
}

function sanitizeStringMetadata(
  metadata: Record<string, unknown>,
): Record<string, string> {
  return Object.entries(metadata).reduce<Record<string, string>>(
    (accumulator, [key, value]) => {
      if (value === undefined || value === null) {
        return accumulator;
      }

      accumulator[key] = String(value);
      return accumulator;
    },
    {},
  );
}
