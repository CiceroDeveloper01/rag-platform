import { registerAs } from "@nestjs/config";

// BullMQ remains the internal runtime queue for conversational orchestration.
export const queueConfig = registerAs("queue", () => ({
  redis: {
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6379),
    db: Number(process.env.REDIS_DB ?? 0),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  inbound: {
    name: process.env.INBOUND_QUEUE_NAME ?? "inbound-messages",
    concurrency: Number(process.env.INBOUND_QUEUE_CONCURRENCY ?? 5),
    attempts: Number(process.env.INBOUND_QUEUE_ATTEMPTS ?? 3),
    backoffMs: Number(process.env.INBOUND_QUEUE_BACKOFF_MS ?? 1000),
    completedRetentionSeconds: Number(
      process.env.INBOUND_QUEUE_COMPLETED_RETENTION_SECONDS ?? 86_400,
    ),
    failedRetentionSeconds: Number(
      process.env.INBOUND_QUEUE_FAILED_RETENTION_SECONDS ?? 604_800,
    ),
    dlqName: process.env.INBOUND_QUEUE_DLQ_NAME ?? "inbound-messages-dlq",
  },
  flowExecution: {
    name: process.env.FLOW_EXECUTION_QUEUE_NAME ?? "flow-execution",
    concurrency: Number(process.env.FLOW_EXECUTION_QUEUE_CONCURRENCY ?? 5),
    attempts: Number(process.env.FLOW_EXECUTION_QUEUE_ATTEMPTS ?? 3),
    backoffMs: Number(process.env.FLOW_EXECUTION_QUEUE_BACKOFF_MS ?? 1000),
    completedRetentionSeconds: Number(
      process.env.FLOW_EXECUTION_QUEUE_COMPLETED_RETENTION_SECONDS ?? 86_400,
    ),
    failedRetentionSeconds: Number(
      process.env.FLOW_EXECUTION_QUEUE_FAILED_RETENTION_SECONDS ?? 604_800,
    ),
    dlqName: process.env.FLOW_EXECUTION_QUEUE_DLQ_NAME ?? "flow-execution-dlq",
  },
}));
