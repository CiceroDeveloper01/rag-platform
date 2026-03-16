import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import { FLOW_EXECUTION_DLQ, INBOUND_MESSAGES_DLQ } from "./queue.constants";

export interface DeadLetterPayload {
  queueName: string;
  jobName: string;
  jobId?: string;
  failedAt: string;
  attemptsMade: number;
  error: {
    message: string;
    stack?: string;
  };
  payload: unknown;
}

@Injectable()
export class DeadLetterQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(DeadLetterQueueService.name);
  private readonly inboundDlq: Queue<DeadLetterPayload>;
  private readonly flowExecutionDlq: Queue<DeadLetterPayload>;

  constructor(private readonly configService: ConfigService) {
    const connection = {
      host: this.configService.get<string>("queue.redis.host", "localhost"),
      port: this.configService.get<number>("queue.redis.port", 6379) ?? 6379,
      db: this.configService.get<number>("queue.redis.db", 0) ?? 0,
      password:
        this.configService.get<string>("queue.redis.password") || undefined,
    };

    this.inboundDlq = new Queue<DeadLetterPayload>(
      this.configService.get<string>(
        "queue.inbound.dlqName",
        INBOUND_MESSAGES_DLQ,
      ) ?? INBOUND_MESSAGES_DLQ,
      { connection },
    );
    this.flowExecutionDlq = new Queue<DeadLetterPayload>(
      this.configService.get<string>(
        "queue.flowExecution.dlqName",
        FLOW_EXECUTION_DLQ,
      ) ?? FLOW_EXECUTION_DLQ,
      { connection },
    );
  }

  async enqueueInboundFailure(payload: DeadLetterPayload): Promise<void> {
    await this.inboundDlq.add(payload.jobName, payload, {
      removeOnComplete: {
        age: 604_800,
        count: 1000,
      },
      jobId: `inbound:${payload.jobId ?? payload.failedAt}`,
    });
    this.logger.warn("Moved inbound job to DLQ", {
      jobId: payload.jobId,
    });
  }

  async enqueueFlowExecutionFailure(payload: DeadLetterPayload): Promise<void> {
    await this.flowExecutionDlq.add(payload.jobName, payload, {
      removeOnComplete: {
        age: 604_800,
        count: 1000,
      },
      jobId: `flow:${payload.jobId ?? payload.failedAt}`,
    });
    this.logger.warn("Moved flow execution job to DLQ", {
      jobId: payload.jobId,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([this.inboundDlq.close(), this.flowExecutionDlq.close()]);
  }
}
