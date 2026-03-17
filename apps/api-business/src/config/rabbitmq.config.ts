import { registerAs } from "@nestjs/config";
import { buildRabbitMqUrl } from "@rag-platform/config";

export const rabbitMqConfig = registerAs("rabbitmq", () => {
  const host = process.env.RABBITMQ_HOST ?? "localhost";
  const port = Number.parseInt(process.env.RABBITMQ_PORT ?? "5672", 10);
  const username = process.env.RABBITMQ_USERNAME ?? "guest";
  const password = process.env.RABBITMQ_PASSWORD ?? "guest";
  const vhost = process.env.RABBITMQ_VHOST ?? "/";
  const queue =
    process.env.RABBITMQ_DOCUMENT_INGESTION_QUEUE ??
    "document.ingestion.requested";

  return {
    host,
    port,
    username,
    password,
    vhost,
    queue,
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
