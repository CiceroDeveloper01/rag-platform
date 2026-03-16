# Testing Guide

This guide summarizes the current test strategy and the most useful validation commands in the repository.

## Current Testing Shape

- unit tests
- integration tests
- end-to-end tests for critical runtime paths

## Test Confidence by Area

Highest confidence currently exists in:

- `apps/orchestrator`
- Telegram-centric runtime behavior
- `AgentGraphService`
- document ingestion
- RAG retrieval
- feature toggle ON/OFF behavior in the orchestrator

Areas still evolving:

- broader API hardening
- stronger end-to-end duplicate event coverage
- stronger tenant-isolation coverage across all surfaces

## Testing Flow

```mermaid
flowchart TD
    Unit[Unit tests] --> Integration[Integration tests]
    Integration --> E2E[End-to-end tests]
    E2E --> Critical[Critical runtime scenarios]
    Critical --> Routing[Agent routing]
    Critical --> Ingestion[Document ingestion]
    Critical --> Retrieval[RAG retrieval]
    Critical --> Toggles[Feature toggle behavior]
```

## Useful Commands

From the repository root:

### Coverage

```bash
npm run coverage:api
npm run coverage:orchestrator
npm run coverage:web
```

### Orchestrator

```bash
npm --prefix apps/orchestrator run test -- --runInBand
npm --prefix apps/orchestrator run test:cov:ci
```

### API

```bash
npm --prefix apps/api run test -- --runInBand
npm --prefix apps/api run test:e2e -- --runInBand
npm --prefix apps/api run test:cov:ci
```

### Web

```bash
npm --prefix apps/web run lint
npm --prefix apps/web run test
npm --prefix apps/web run test:coverage
```

## Critical Path Scenarios

```mermaid
sequenceDiagram
    participant Channel as Channel input
    participant Inbound as Inbound runtime
    participant Agent as Agent graph
    participant Flow as Flow execution
    participant Outbound as Outbound delivery

    Channel->>Inbound: canonical inbound payload
    Inbound->>Agent: runtime planning
    Agent->>Flow: executionRequest
    Flow->>Outbound: response or document action
```

Prioritize validation of:

- Telegram inbound mapping
- supervisor routing
- document ingestion
- indexed-document retrieval
- flow execution
- feature toggle behavior with both enabled and disabled states

## Honest Reading of the Current State

- confidence is high in the critical orchestrator runtime path
- the API is improving, but remains less mature than the orchestrator in overall confidence
- duplicate event handling and tenant isolation still deserve stronger end-to-end validation
