# Conversation Memory

This document describes the current production-oriented conversation memory flow.

## Scope

Conversation memory is persisted as a tenant-aware operational context store for the orchestrator.

The current flow is:

```text
Inbound message
  -> Orchestrator resolves tenant
  -> Conversation agent generates a 128-dim memory embedding
  -> Orchestrator stores memory through the internal API
  -> API persists scoped memory in PostgreSQL + pgvector
  -> Orchestrator queries recent + semantic memories for the same tenant/channel/conversation
  -> Memory context is merged with RAG context
```

## Scope keys

Memory is scoped by:

- `tenant_id`
- `channel`
- `conversation_id`

This prevents semantic bleed across tenants and channels while keeping retrieval local to the active conversation.

## Persistence model

The `conversation_memory` table stores:

- tenant and channel scope
- conversation id
- role
- message text
- 128-dim embedding
- metadata
- creation timestamp
- optional expiration timestamp

## Retention and limits

Supported environment variables:

- `MEMORY_RETENTION_DAYS`
- `MEMORY_MAX_MESSAGE_CHARS`
- `MEMORY_MAX_MESSAGES_PER_CONVERSATION`
- `MEMORY_RECENT_LIMIT`
- `MEMORY_SEMANTIC_LIMIT`

Current defaults:

- retention: `30` days
- max stored message size: `4000` chars
- max messages per conversation: `200`
- recent window: `8`
- semantic window: `5`

When a new memory entry is stored:

1. the message is trimmed to the configured max size
2. an expiration timestamp is computed
3. the conversation is trimmed to the latest configured number of messages
4. expired rows are purged opportunistically

## Observability

The current implementation emits:

- API traces for store and query
- API latency metrics for store and query
- orchestrator counters for memory store/query usage
- structured logs with tenant, channel, conversation, and role context

## Current boundary

The API is the persistence boundary and PostgreSQL is the source of truth.

The orchestrator remains responsible for:

- embedding generation for conversation memory
- deciding when to store and retrieve memory
- composing memory context with RAG context and language instructions

This keeps database concerns out of the orchestrator runtime while preserving the existing internal API pattern.
