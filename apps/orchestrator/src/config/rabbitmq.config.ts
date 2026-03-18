import { registerAs } from "@nestjs/config";
import { buildRabbitMqUrl } from "@rag-platform/config";

export const rabbitMqConfig = registerAs("rabbitmq", () => {
  const host = process.env.RABBITMQ_HOST ?? "localhost";
  const port = Number.parseInt(process.env.RABBITMQ_PORT ?? "5672", 10);
  const username =
    process.env.RABBITMQ_ORCHESTRATOR_USER ??
    process.env.RABBITMQ_USER ??
    process.env.RABBITMQ_USERNAME ??
    "guest";
  const password =
    process.env.RABBITMQ_ORCHESTRATOR_PASS ??
    process.env.RABBITMQ_PASS ??
    process.env.RABBITMQ_PASSWORD ??
    "guest";
  const vhost = process.env.RABBITMQ_VHOST ?? "/";
  const queue =
    process.env.RABBITMQ_QUEUE_DOCUMENT_INGESTION ??
    process.env.RABBITMQ_DOCUMENT_INGESTION_QUEUE ??
    "document.ingestion.requested";
  const exchange =
    process.env.RABBITMQ_DOCUMENT_INGESTION_EXCHANGE ??
    "documents.ingestion";
  const routingKey =
    process.env.RABBITMQ_DOCUMENT_INGESTION_ROUTING_KEY ?? queue;
  const retryExchange =
    process.env.RABBITMQ_DOCUMENT_INGESTION_RETRY_EXCHANGE ??
    "documents.ingestion.retry";
  const retryQueue =
    process.env.RABBITMQ_DOCUMENT_INGESTION_RETRY_QUEUE ??
    `${queue}.retry`;
  const retryRoutingKey =
    process.env.RABBITMQ_DOCUMENT_INGESTION_RETRY_ROUTING_KEY ??
    `${routingKey}.retry`;
  const deadLetterExchange =
    process.env.RABBITMQ_DOCUMENT_INGESTION_DLX ??
    "documents.ingestion.dlx";
  const deadLetterQueue =
    process.env.RABBITMQ_DOCUMENT_INGESTION_DLQ ??
    `${queue}.dlq`;
  const deadLetterRoutingKey =
    process.env.RABBITMQ_DOCUMENT_INGESTION_DLQ_ROUTING_KEY ??
    `${routingKey}.dead`;

  return {
    host,
    port,
    username,
    password,
    vhost,
    queue,
    exchange,
    routingKey,
    retryExchange,
    retryQueue,
    retryRoutingKey,
    retryDelayMs: Number.parseInt(
      process.env.RABBITMQ_DOCUMENT_INGESTION_RETRY_DELAY_MS ?? "30000",
      10,
    ),
    maxAttempts: Number.parseInt(
      process.env.RABBITMQ_DOCUMENT_INGESTION_MAX_ATTEMPTS ?? "3",
      10,
    ),
    deadLetterExchange,
    deadLetterQueue,
    deadLetterRoutingKey,
    prefetchCount: Number.parseInt(
      process.env.RABBITMQ_DOCUMENT_INGESTION_PREFETCH ?? "5",
      10,
    ),
    url: buildRabbitMqUrl({
      host,
      port,
      username,
      password,
      vhost,
    }),
  };
});
