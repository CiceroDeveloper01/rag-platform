# ADR-011 — Persisted Document Status as the UI Source of Truth

## Status

Accepted

## Context

Once document ingestion became asynchronous, the web UI needed a reliable way to show progress and outcomes. RabbitMQ itself is not an appropriate UI data source.

## Decision

Persist document ingestion status and step information in the business layer and expose it through APIs consumed by the web portal.

The web UI must read persisted state. It must not query RabbitMQ directly.

The persisted state also carries the operational metadata required to support
retries, terminal failures, and explicit replay without making the queue itself
the operator-facing source of truth.

## Consequences

### Positive

- stable UI source of truth
- clearer operational debugging
- safer separation between transport and user-facing state
- better support for idempotency and replay decisions in the async pipeline

### Trade-offs

- more persistence fields and callbacks are required
- state updates and queue processing must stay consistent
