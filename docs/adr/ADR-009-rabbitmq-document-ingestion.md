# ADR-009 — RabbitMQ for Document Ingestion

## Status

Accepted

## Context

Document ingestion is heavier than normal chat or message reply flows because it can require parsing, chunking, embeddings, and indexing.

The platform needed a simple asynchronous transport for this workload without moving the entire chat/runtime model to RabbitMQ.

## Decision

Use RabbitMQ only for document ingestion.

Current initial queue:

- `document.ingestion.requested`

Producer:

- `apps/api-business`

Consumer:

- `apps/orchestrator`

## Consequences

### Positive

- document uploads can return `202 Accepted`
- channel conversations do not block on heavy indexing work
- the queue scope remains simple and easy to reason about

### Trade-offs

- the platform now operates BullMQ and RabbitMQ for different concerns
- status persistence becomes essential because the queue is not the UI source of truth
