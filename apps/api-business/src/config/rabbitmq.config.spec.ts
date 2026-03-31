import { ACTIVE_MESSAGING_TOPOLOGY } from "@rag-platform/contracts";
import { rabbitMqConfig } from "./rabbitmq.config";

describe("rabbitMqConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.RABBITMQ_QUEUE_DOCUMENT_INGESTION;
    delete process.env.RABBITMQ_DOCUMENT_INGESTION_QUEUE;
    delete process.env.RABBITMQ_DOCUMENT_INGESTION_EXCHANGE;
    delete process.env.RABBITMQ_DOCUMENT_INGESTION_ROUTING_KEY;
    delete process.env.RABBITMQ_DOCUMENT_INGESTION_RETRY_EXCHANGE;
    delete process.env.RABBITMQ_DOCUMENT_INGESTION_RETRY_QUEUE;
    delete process.env.RABBITMQ_DOCUMENT_INGESTION_RETRY_ROUTING_KEY;
    delete process.env.RABBITMQ_DOCUMENT_INGESTION_DLX;
    delete process.env.RABBITMQ_DOCUMENT_INGESTION_DLQ;
    delete process.env.RABBITMQ_DOCUMENT_INGESTION_DLQ_ROUTING_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("uses the active topology defaults for the current ingestion flow", () => {
    const config = rabbitMqConfig();

    expect(config).toEqual(
      expect.objectContaining({
        queue: ACTIVE_MESSAGING_TOPOLOGY.ingestion.documentRequested.queue,
        exchange:
          ACTIVE_MESSAGING_TOPOLOGY.ingestion.documentRequested.exchange,
        routingKey:
          ACTIVE_MESSAGING_TOPOLOGY.ingestion.documentRequested.routingKey,
        retryExchange:
          ACTIVE_MESSAGING_TOPOLOGY.ingestion.documentRequested.retryExchange,
        retryQueue:
          ACTIVE_MESSAGING_TOPOLOGY.ingestion.documentRequested.retryQueue,
        retryRoutingKey:
          ACTIVE_MESSAGING_TOPOLOGY.ingestion.documentRequested
            .retryRoutingKey,
        deadLetterExchange:
          ACTIVE_MESSAGING_TOPOLOGY.ingestion.documentRequested
            .deadLetterExchange,
        deadLetterQueue:
          ACTIVE_MESSAGING_TOPOLOGY.ingestion.documentRequested.deadLetterQueue,
        deadLetterRoutingKey:
          ACTIVE_MESSAGING_TOPOLOGY.ingestion.documentRequested
            .deadLetterRoutingKey,
      }),
    );
  });

  it("still allows environment overrides without changing the topology contract", () => {
    process.env.RABBITMQ_DOCUMENT_INGESTION_EXCHANGE = "custom.exchange";
    process.env.RABBITMQ_DOCUMENT_INGESTION_QUEUE = "custom.queue";

    const config = rabbitMqConfig();

    expect(config.exchange).toBe("custom.exchange");
    expect(config.queue).toBe("custom.queue");
  });
});
