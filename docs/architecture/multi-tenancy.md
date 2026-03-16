# Multi-Tenancy

The platform currently applies tenant isolation in the runtime paths that feed agents, RAG, analytics events, and conversation memory.

## Current Model

- `orchestrator` resolves tenant context from inbound headers, channel metadata, or JWT claims
- `api` resolves tenant context from `x-tenant-id`, explicit DTO fields, or metadata
- `documents`, `search`, and `conversation_memory` are scoped by `tenant_id`
- `analytics` events carry `tenantId` through the event payload
- analytics snapshots and omnichannel dashboard queries are filtered by tenant
- `conversations` remain user-scoped in the synchronous chat module and were not force-refactored in this pass

## Resolution Order

### API

`TenantContextService` resolves tenant using:

1. explicit DTO field such as `tenantId`
2. `x-tenant-id` header
3. `metadata.tenantId`
4. `default-tenant`

### Orchestrator

`TenantResolverService` resolves tenant using:

1. `x-tenant-id` or `tenant-id` header
2. channel metadata `tenantId`
3. JWT `tenantId`
4. derived tenant from JWT `sub`
5. `default-tenant`

## Tenant Flow

```text
Inbound channel event
  -> tenant resolved in orchestrator
  -> tenant propagated in message metadata
  -> memory store/query scoped by tenant + channel + conversation
  -> RAG retrieval scoped by tenant
  -> internal API requests include tenantId
  -> PostgreSQL persists/query by tenant_id
```

## Scoped Persistence

The following paths are tenant-aware in the current implementation:

- `documents.tenant_id`
- `conversation_memory.tenant_id`
- semantic search queries filtered by `tenant_id`
- orchestrator traces and analytics payloads carrying `tenantId`
- analytics REST snapshots resolved by tenant
- analytics websocket frames filtered by tenant
- omnichannel dashboard queries filtered by `metadata.tenantId`

## Request Examples

### Semantic Search

```http
POST /search
x-tenant-id: tenant-acme
content-type: application/json

{
  "query": "Where is my invoice?",
  "top_k": 5
}
```

### Internal Document Registration

```json
{
  "tenantId": "tenant-acme",
  "source": "telegram",
  "content": "Customer billing question",
  "externalMessageId": "tg:1001",
  "metadata": {
    "tenantId": "tenant-acme",
    "ragSource": "telegram"
  }
}
```

### Analytics Snapshot

```http
GET /analytics/languages
x-tenant-id: tenant-acme
```

### Omnichannel Dashboard

```http
GET /api/v1/omnichannel/overview
x-tenant-id: tenant-acme
```

### Orchestrator Message Metadata

```json
{
  "tenantId": "tenant-acme",
  "telegramChatId": "84722",
  "updateId": 99123
}
```

## Isolation Risks Still Relevant

- the synchronous `chat` and `conversations` module are still primarily user-scoped, not tenant-column scoped
- existing historical `documents` rows created before the migration are backfilled to `default-tenant`
- tenant resolution still depends on trusted upstream propagation; production auth should attach tenant claims consistently
- omnichannel connectors are still global operational configuration in the current model

## Operational Guidance

- always send `x-tenant-id` from trusted internal callers when a request is tenant-specific
- when publishing channel events, include `metadata.tenantId`
- avoid cross-tenant cache keys; retrieval cache keys already include `tenantId`
- treat `default-tenant` as a compatibility fallback, not the preferred production path
