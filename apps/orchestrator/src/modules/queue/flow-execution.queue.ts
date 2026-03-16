import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JobsOptions, Queue } from "bullmq";
import { FLOW_EXECUTION_QUEUE } from "./queue.constants";
import { FlowExecutionPayload } from "./flow-execution.types";

@Injectable()
export class FlowExecutionQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(FlowExecutionQueueService.name);
  private readonly queue: Queue<FlowExecutionPayload>;
  private readonly defaultJobOptions: JobsOptions;

  constructor(private readonly configService: ConfigService) {
    this.queue = new Queue<FlowExecutionPayload>(
      this.configService.get<string>(
        "queue.flowExecution.name",
        FLOW_EXECUTION_QUEUE,
      ) ?? FLOW_EXECUTION_QUEUE,
      {
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

    this.defaultJobOptions = {
      attempts:
        this.configService.get<number>("queue.flowExecution.attempts", 3) ?? 3,
      backoff: {
        type: "exponential",
        delay:
          this.configService.get<number>(
            "queue.flowExecution.backoffMs",
            1000,
          ) ?? 1000,
      },
      removeOnComplete: {
        age:
          this.configService.get<number>(
            "queue.flowExecution.completedRetentionSeconds",
            86_400,
          ) ?? 86_400,
        count: 1000,
      },
      removeOnFail: {
        age:
          this.configService.get<number>(
            "queue.flowExecution.failedRetentionSeconds",
            604_800,
          ) ?? 604_800,
        count: 1000,
      },
    };
  }

  async enqueue(jobName: string, payload: FlowExecutionPayload): Promise<void> {
    await this.queue.add(jobName, payload, {
      ...this.defaultJobOptions,
      jobId: `${jobName}:${payload.channel}:${payload.externalMessageId}`,
    });

    this.logger.log(
      `Queued flow execution ${jobName} for ${payload.externalMessageId}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
