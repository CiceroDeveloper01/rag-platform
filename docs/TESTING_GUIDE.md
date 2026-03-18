# Testing Guide

This guide summarizes the current testing approach and the most relevant commands after the repository reorganization.

## Current Test Shape

- unit tests
- integration-style module tests
- API e2e tests
- orchestrator runtime tests
- frontend feature tests

## Confidence by Boundary

Highest confidence:

- `apps/orchestrator`
- document ingestion worker flow
- BullMQ runtime behavior
- web document UI and status polling behavior

Good but still evolving:

- `apps/api-business`
- `apps/api-web`

Still worth strengthening further:

- end-to-end tenant isolation
- duplicate event handling and idempotency
- complete web alignment with `api-web`

## Recommended Validation Commands

### Root

```bash
npm run ci
npm run test:rabbitmq:integration
```

### api-business

```bash
npm --prefix apps/api-business run lint
npm --prefix apps/api-business run build
npm --prefix apps/api-business run test -- --runInBand
npm --prefix apps/api-business run test:e2e -- --runInBand
npm --prefix apps/api-business run test:rabbitmq:integration
```

### api-web

```bash
npm --prefix apps/api-web run lint
npm --prefix apps/api-web run build
npm --prefix apps/api-web run test -- --runInBand
```

### orchestrator

```bash
npm --prefix apps/orchestrator run lint
npm --prefix apps/orchestrator run build
npm --prefix apps/orchestrator run test -- --runInBand
npm --prefix apps/orchestrator run test:rabbitmq:integration
```

Notes:

- the orchestrator test suite uses local Jest shims for `bullmq` and
  `@langchain/langgraph` so CI does not depend on the workspace hoisting shape
- the orchestrator build also carries local module declarations for these two
  runtime libraries to keep `nest build` stable in workspace-based CI runners
- these shims and declarations exist only to stabilize build/test resolution;
  they do not change runtime behavior in development or production

### web

```bash
npm --prefix apps/web run lint
npm --prefix apps/web run test
npm --prefix apps/web run build
```

## Async Document Ingestion Validation

RabbitMQ integration tests require a real broker. Reuse the local Docker broker:

```bash
docker compose up -d rabbitmq
```

```mermaid
sequenceDiagram
    participant Upload as Upload request
    participant API as api-business
    participant Rabbit as RabbitMQ
    participant Worker as orchestrator worker
    participant Status as status API

    Upload->>API: POST /ingestion/upload
    API-->>Upload: 202 Accepted
    API->>Rabbit: publish document.ingestion.requested
    Rabbit->>Worker: consume event
    Worker->>Status: update step and final status
```

Validate at least:

- upload returns `202 Accepted`
- initial persisted status is `PENDING`
- worker transitions to `PROCESSING`
- `currentStep` progresses when applicable
- final state becomes `COMPLETED` or `FAILED`
- if a document reaches terminal `FAILED`, confirm replay remains possible only
  through the persisted-source path, not through direct queue manipulation

Current RabbitMQ-specific test layers:

- publisher unit tests validate payload, headers, tracing, and publish failure propagation
- consumer unit tests validate success, retry, DLQ, invalid payload, nack fallback, and idempotent skip behavior
- broker integration tests validate:
  - real publisher to RabbitMQ topology and message contract
  - real consumer success flow
  - retry with bounded attempts
  - DLQ routing after retry exhaustion
  - duplicate-event idempotency against heavy processing

## Manual Regression Checklist

- upload a document from the web
- verify `/documents/status`
- verify RabbitMQ consumer logs
- verify channel-origin document handoff still acknowledges without blocking
- verify chat still works synchronously

## Honest Note

The repository is strong on runtime and structural validation. The biggest remaining gaps are around broader cross-boundary e2e coverage, not around the basic build/testability of the current architecture.
