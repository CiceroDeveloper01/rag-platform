# API Business

`apps/api-business` is the synchronous business and domain API boundary.

## Responsibilities

This app owns business capabilities that already existed in the repository, including:

- chat
- documents
- ingestion
- search and retrieval
- conversations
- memory
- internal ingestion callbacks used by the orchestrator

It now also owns the new `banking` domain used by the AI Account Manager scenario.

## Logical Domain Split

The current organization is intentionally split in logical terms:

- `Banking Core`
  - `modules/banking/customer`
  - `modules/banking/cards`
  - `modules/banking/investments`
  - `modules/banking/credit`
- `AI Platform Capabilities`
  - `chat`
  - `search`
  - `documents`
  - `ingestion`
  - `memory`
  - `conversations`
  - internal synchronous support endpoints used by the orchestrator

This is not a physical split into new applications yet. It is a preparation step for future architectural decisions.

## Banking Domain

Current banking subdomains:

- `cards`
- `investments`
- `customer`
- `credit`

These modules expose stable HTTP contracts already consumed by orchestrator tools.

## Architectural Boundaries

- it is the business API, not the portal UI
- it is not the asynchronous orchestration runtime
- it should not absorb presentation concerns that belong to `api-web`
- it is the correct place for future repositories, integrations, and persistent banking business logic

## Current State

The banking services are currently mock-backed and in-memory, but their controllers, services, DTOs, and routes are already structured as business modules ready for later persistence or external integration.

## Messaging

RabbitMQ topology is now being documented centrally with domain-oriented naming conventions. The current document ingestion publisher still uses the existing active binding for compatibility, while the broader topology map prepares future banking, handoff, and memory workloads.

## Typical Local Commands

```bash
npm --prefix apps/api-business run lint
npm --prefix apps/api-business run test -- --runInBand
npm --prefix apps/api-business run build
npm --prefix apps/api-business run start:debug
```
