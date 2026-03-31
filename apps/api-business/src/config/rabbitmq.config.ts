import { registerAs } from "@nestjs/config";
import { buildRabbitMqUrl } from "@rag-platform/config";
import { ACTIVE_MESSAGING_TOPOLOGY } from "@rag-platform/contracts";

// RabbitMQ stays focused on durable async publishing, not synchronous banking reads or chat flows.
export const rabbitMqConfig = registerAs("rabbitmq", () => {
  const activeIngestionTopology =
    ACTIVE_MESSAGING_TOPOLOGY.ingestion.documentRequested;
  const host = process.env.RABBITMQ_HOST ?? "localhost";
  const port = Number.parseInt(process.env.RABBITMQ_PORT ?? "5672", 10);
  const username =
    process.env.RABBITMQ_API_BUSINESS_USER ??
    process.env.RABBITMQ_USER ??
    process.env.RABBITMQ_USERNAME ??
    "guest";
  const password =
    process.env.RABBITMQ_API_BUSINESS_PASS ??
    process.env.RABBITMQ_PASS ??
    process.env.RABBITMQ_PASSWORD ??
    "guest";
  const vhost = process.env.RABBITMQ_VHOST ?? "/";
  const queue =
    process.env.RABBITMQ_QUEUE_DOCUMENT_INGESTION ??
    process.env.RABBITMQ_DOCUMENT_INGESTION_QUEUE ??
    activeIngestionTopology.queue;
  const exchange =
    process.env.RABBITMQ_DOCUMENT_INGESTION_EXCHANGE ??
    activeIngestionTopology.exchange;
  const routingKey =
    process.env.RABBITMQ_DOCUMENT_INGESTION_ROUTING_KEY ??
    activeIngestionTopology.routingKey;
  const retryExchange =
    process.env.RABBITMQ_DOCUMENT_INGESTION_RETRY_EXCHANGE ??
    activeIngestionTopology.retryExchange;
  const retryQueue =
    process.env.RABBITMQ_DOCUMENT_INGESTION_RETRY_QUEUE ??
    activeIngestionTopology.retryQueue;
  const retryRoutingKey =
    process.env.RABBITMQ_DOCUMENT_INGESTION_RETRY_ROUTING_KEY ??
    activeIngestionTopology.retryRoutingKey;
  const deadLetterExchange =
    process.env.RABBITMQ_DOCUMENT_INGESTION_DLX ??
    activeIngestionTopology.deadLetterExchange;
  const deadLetterQueue =
    process.env.RABBITMQ_DOCUMENT_INGESTION_DLQ ??
    activeIngestionTopology.deadLetterQueue;
  const deadLetterRoutingKey =
    process.env.RABBITMQ_DOCUMENT_INGESTION_DLQ_ROUTING_KEY ??
    activeIngestionTopology.deadLetterRoutingKey;

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
