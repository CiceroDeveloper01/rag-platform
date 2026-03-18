# ADR-010 — Synchronous Chat and Asynchronous Documents

## Status

Accepted

## Context

The platform handles both immediate conversational requests and heavy document processing. Treating both workloads the same would either block user interactions or overcomplicate simple chat flows.

## Decision

Keep chat synchronous for now and move heavy document ingestion to the asynchronous worker path.

This means:

- chat remains request/response oriented where immediate answers are needed
- documents use RabbitMQ when parsing, chunking, embeddings, or indexing are required

## Consequences

### Positive

- immediate chat UX remains simple
- document processing no longer blocks the user
- the architecture reflects real workload differences

### Trade-offs

- the platform must document two execution styles
- RAG behavior across entry points still needs continued alignment
