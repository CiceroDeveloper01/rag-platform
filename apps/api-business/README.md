# API Business

`apps/api-business` is the synchronous business/domain API boundary.

## Responsibilities

This app owns business capabilities that already exist in the repository, including:

- chat
- documents
- ingestion
- search and retrieval
- conversations
- memory
- internal ingestion callbacks used by the orchestrator

## Document Ingestion Role

`api-business` is the RabbitMQ producer for asynchronous document ingestion.

When a document is accepted for heavy processing, this app:

1. validates and stores metadata
2. persists initial status such as `PENDING`
3. publishes `document.ingestion.requested`
4. returns `202 Accepted`

It also exposes persisted status queries and internal callbacks for:

- status updates
- completion
- failure

## Architectural Boundaries

- it is not the portal UI
- it is not the asynchronous worker runtime
- it should not absorb presentation concerns that belong to `api-web`

## Typical Local Commands

```bash
npm --prefix apps/api-business run lint
npm --prefix apps/api-business run test -- --runInBand
npm --prefix apps/api-business run build
npm --prefix apps/api-business run start:debug
```
