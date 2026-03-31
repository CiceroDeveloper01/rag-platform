# ADR-001 — Database Strategy

## Status

Accepted

## Context

The Intelligent Automation Platform needs a single persistence layer capable of supporting multiple data shapes and operational concerns at the same time. The platform stores relational application data such as users, sessions, conversations, requests, and connector state, but it also needs to persist document chunks and vector embeddings for knowledge retrieval workflows.

At the same time, the omnichannel module and the dashboard query layer require operational metadata, execution history, and reporting-friendly records. Introducing separate databases for transactional data and vector search would increase infrastructure complexity, raise operational overhead, and make local development harder.

The platform therefore needed a database strategy that could support:

- relational data and transactional consistency
- document ingestion and chunk persistence
- vector similarity search
- omnichannel message and execution history
- operational metrics and dashboard queries

## Decision

Use **PostgreSQL with the pgvector extension** as the primary data platform.

PostgreSQL is used as the single source of truth for:

- transactional application data
- knowledge retrieval document chunks
- vector embeddings
- conversations and chat history
- omnichannel messages and executions
- operational snapshots used by analytics endpoints

Vector retrieval is implemented directly through SQL using `pgvector`, which allows the platform to keep retrieval logic close to the data model while preserving the flexibility of a relational database.

## Consequences

### Positive

- Simplifies the infrastructure stack by consolidating transactional and vector workloads in one database technology.
- Reduces operational complexity for local development, CI, Docker, and observability.
- Preserves SQL expressiveness for filtering, joins, and reporting on omnichannel and knowledge retrieval data.
- Keeps the architecture easier to reason about for engineers who need both application and analytics visibility.
- Works well with the platform's current monorepo and backend query/repository approach.

### Trade-offs

- PostgreSQL is not a specialized vector database, so very large-scale retrieval workloads may require further tuning or future architectural review.
- Vector search performance depends on careful indexing, query design, and ingestion discipline.
- Consolidating multiple concerns into one database increases the importance of schema governance and query optimization.
- The platform accepts the operational coupling of transactional and retrieval workloads in exchange for simplicity and maintainability.
