import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  createStructuredLogEntry,
  NoopMetricsRecorder,
  NoopTracer,
} from "@rag-platform/observability";
import { Job, Worker } from "bullmq";
import {
  INBOUND_MESSAGES_QUEUE,
  MESSAGE_RECEIVED_JOB,
} from "../queue/queue.constants";
import { InboundMessagePayload } from "../queue/inbound-message.types";
import { OrchestratorRuntimeService } from "./orchestrator-runtime.service";

@Injectable()
export class InboundMessageProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InboundMessageProcessor.name);
  private readonly tracer = new NoopTracer();
  private readonly metrics = new NoopMetricsRecorder();
  private worker?: Worker<InboundMessagePayload>;

  constructor(
    private readonly configService: ConfigService,
    private readonly orchestratorRuntimeService: OrchestratorRuntimeService,
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
      async (job: Job<InboundMessagePayload>) => {
        if (job.name !== MESSAGE_RECEIVED_JOB) {
          this.logger.warn(`Ignoring unsupported job ${job.name}`);
          return;
        }

        await this.tracer.runInSpan(
          "orchestrator.inbound.process",
          async () => {
            this.metrics.increment("orchestrator_inbound_jobs_total", {
              channel: job.data.channel,
            });
            this.logger.log(
              JSON.stringify(
                createStructuredLogEntry(
                  "InboundMessageProcessor",
                  "Processing inbound message",
                  {
                    jobId: job.id,
                    channel: job.data.channel,
                    externalMessageId: job.data.externalMessageId,
                  },
                ),
              ),
            );
            await this.orchestratorRuntimeService.handleMessage(job.data);
          },
        );
      },
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

    this.worker.on("completed", (job) => {
      this.logger.log(`Completed inbound job ${job.id ?? "unknown"}`);
    });
    this.worker.on("failed", (job, error) => {
      this.logger.error(
        `Failed inbound job ${job?.id ?? "unknown"}: ${error.message}`,
      );
    });

    this.logger.log(
      `Inbound message processor started on queue ${queueName} with concurrency ${String(
        concurrency,
      )}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
