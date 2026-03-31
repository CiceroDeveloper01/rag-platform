import {
  ACTIVE_MESSAGING_TOPOLOGY,
  CANONICAL_MESSAGING_TOPOLOGY,
  MESSAGING_NAMING_CONVENTIONS,
  withRetryAndDeadLetter,
} from "@rag-platform/contracts";

describe("messaging topology", () => {
  it("defines the requested canonical topology groups", () => {
    expect(
      CANONICAL_MESSAGING_TOPOLOGY.orchestrator.inboundMessage.queue,
    ).toBe("orchestrator.inbound-message");
    expect(CANONICAL_MESSAGING_TOPOLOGY.handoff.completed.queue).toBe(
      "handoff.completed",
    );
    expect(
      CANONICAL_MESSAGING_TOPOLOGY.ingestion.documentEmbedding.queue,
    ).toBe("ingestion.document-embedding");
    expect(CANONICAL_MESSAGING_TOPOLOGY.memory.contextQuery.queue).toBe(
      "memory.context-query",
    );
    expect(
      CANONICAL_MESSAGING_TOPOLOGY.banking.cards.blockRequested.queue,
    ).toBe("banking.cards.block-requested");
  });

  it("keeps the active ingestion binding compatible with the current runtime", () => {
    expect(ACTIVE_MESSAGING_TOPOLOGY.ingestion.documentRequested).toEqual(
      expect.objectContaining({
        exchange: "documents.ingestion",
        queue: "document.ingestion.requested",
        routingKey: "document.ingestion.requested",
        retryExchange: "documents.ingestion.retry",
        deadLetterExchange: "documents.ingestion.dlx",
      }),
    );
  });

  it("documents the naming conventions and derives retry or dead-letter bindings consistently", () => {
    expect(MESSAGING_NAMING_CONVENTIONS.queuePattern).toBe(
      "<exchange>.<action>-<state>",
    );

    expect(
      withRetryAndDeadLetter({
        exchange: "banking.cards",
        queue: "banking.cards.block-requested",
        routingKey: "block.requested",
      }),
    ).toEqual(
      expect.objectContaining({
        retryExchange: "banking.cards.retry",
        retryQueue: "banking.cards.block-requested.retry",
        retryRoutingKey: "block.requested.retry",
        deadLetterExchange: "banking.cards.dlx",
        deadLetterQueue: "banking.cards.block-requested.dlq",
        deadLetterRoutingKey: "block.requested.dead",
      }),
    );
  });
});
