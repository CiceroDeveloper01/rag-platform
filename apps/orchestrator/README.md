# Orchestrator

`apps/orchestrator` is the asynchronous runtime and conversational coordinator of the platform.

## Responsibilities

This app owns:

- channel listeners and adapters
- BullMQ processors
- supervisor and specialized agent flows
- banking account manager orchestration
- decision layer
- specialists
- tools
- guardrails
- response composition
- handoff routing
- RabbitMQ-backed document ingestion consumers and workers

## Banking Role

The orchestrator is the current home of the AI Account Manager scenario.

In the banking branch it:

- receives user messages
- classifies intent
- routes to specialists such as cards and investments
- uses knowledge retrieval for knowledge questions
- uses tools for deterministic business queries and actions
- protects sensitive actions with guardrails
- reuses the real handoff pipeline when needed

## Architectural Boundaries

- it is not the source of truth for business persistence
- it should not own business repositories that belong in `api-business`
- it may call `api-business` through internal tools and integration clients
- it should keep decision logic in the orchestration and specialist layers, not inside tools

## Typical Local Commands

```bash
npm --prefix apps/orchestrator run lint
npm --prefix apps/orchestrator run test -- --runInBand
npm --prefix apps/orchestrator run build
npm --prefix apps/orchestrator run start:dev
```
