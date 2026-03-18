# Orchestrator

`apps/orchestrator` is the asynchronous runtime of the platform.

## Responsibilities

This app owns:

- channel listeners and adapters
- BullMQ processors
- agent graph and specialized agents
- runtime tools
- outbound routing
- RabbitMQ-backed document ingestion consumers and workers

## Runtime Scope

The orchestrator is responsible for:

- reacting to inbound channel events
- planning work through agents
- replying through outbound channels
- coordinating heavy asynchronous document ingestion

It is not the portal API and it is not the primary business persistence boundary.

## Queues

### BullMQ

- `inbound-messages`
- `flow-execution`

### RabbitMQ

- `document.ingestion.requested`
- `document.ingestion.requested.retry`
- `document.ingestion.requested.dlq`

The RabbitMQ path is intentionally limited to document ingestion. It uses
bounded retries, explicit dead-letter handling, and persisted status as the
operator-facing source of truth.

## Typical Local Commands

```bash
npm --prefix apps/orchestrator run lint
npm --prefix apps/orchestrator run test -- --runInBand
npm --prefix apps/orchestrator run build
npm --prefix apps/orchestrator run start:dev
```

## CI and Build Notes

To keep workspace-based CI runners stable, the orchestrator includes:

- local Jest shims for `bullmq` and `@langchain/langgraph`
- local TypeScript module declarations for those same runtime libraries

These files exist only to stabilize test/build resolution inside the monorepo.
They do not replace the real runtime dependencies used by the application.
