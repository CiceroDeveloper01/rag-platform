# Technical Debt and Architectural Gaps

## Purpose

This document records known technical and architectural debt in the repository.

It is intended to be honest, practical, and specific. The goal is not to
criticize the platform. The goal is to make trade-offs explicit so future work
can be prioritized with the real codebase in mind.

This register focuses on architectural and engineering debt that is visible in
the current repository. It does not list cosmetic issues or speculative future
features.

## Current Context

The repository already has a clear architectural direction:

- the asynchronous runtime lives in `apps/orchestrator`
- channel adapters are organized by channel domain
- the orchestrator uses queues, agents, tools, and guardrails
- the API owns synchronous management, search, chat, ingestion, and memory
  surfaces
- the web application exposes operator, dashboard, chat, and document flows

That direction is solid. The remaining debt is mostly about alignment,
duplication, and operational hardening.

## Known Architectural Debt

### 1. Web chat and document flows are not fully aligned with the orchestrator runtime

The repository contains a strong orchestrator-centered runtime, but the web
application still talks directly to business API flows for some core product
experiences:

- `apps/web/src/features/chat/services/chat-api.service.ts`
- `apps/web/src/features/documents/services/documents-api.service.ts`

Those flows call:

- `POST /chat`
- `POST /ingestion/upload`

The corresponding API implementations live in:

- `apps/api-business/src/modules/chat/controllers/chat.controller.ts`
- `apps/api-business/src/modules/ingestion/controllers/ingestion.controller.ts`

This means the repository currently has two different ways to exercise the
platform:

- channel-driven runtime through the orchestrator
- direct synchronous RAG and ingestion flows through the API

#### Impact

- the public platform story is centered on agents and asynchronous orchestration
- the web product still demonstrates important user flows through direct API
  business endpoints
- behavior, observability, and failure handling are not fully unified across
  those paths

#### Desired direction

If agents and the orchestrator are the intended core runtime, web-facing chat
and document submission should eventually align more closely with the same
runtime path, or the product should explicitly treat the direct API RAG path as
an intentional second execution model.

### 2. RAG execution is split across API and orchestrator implementations

The repository currently contains two real RAG-oriented execution paths:

- API chat path:
  - `apps/api-business/src/modules/chat/services/chat.service.ts`
- orchestrator retrieval path:
  - `apps/orchestrator/src/modules/agents/conversation-agent/conversation.agent.ts`
  - `apps/orchestrator/src/modules/rag/retrieval.service.ts`

The API chat path performs retrieval, context building, and answer generation
inside the API module graph. The orchestrator path performs retrieval and memory
assembly inside the agent runtime and then materializes the response through the
flow execution stage.

#### Impact

- product behavior can diverge between API chat and channel/orchestrator chat
- tuning retrieval quality or prompt assembly may require touching multiple
  execution paths
- operators can see different runtime characteristics depending on entry point

#### Desired direction

Reduce the number of competing RAG execution paths, or clearly define which one
is the platform reference path and which one is a transitional convenience
surface.

### 3. Document ingestion is also split across API and orchestrator-oriented flows

The API owns a direct upload and ingestion pipeline:

- `apps/api-business/src/modules/ingestion/services/ingestion.service.ts`

The orchestrator owns a separate document-ingestion tool pipeline and a document
indexer:

- `apps/orchestrator/src/modules/tools/document-ingestion/document-ingestion.pipeline.ts`
- `apps/orchestrator/src/modules/rag/document-indexer.service.ts`

These paths are related, but they are not a single unified ingestion model.

#### Impact

- document registration, storage, indexing, and retrieval are harder to reason
  about end to end
- the platform has more than one ingestion story depending on entry point
- future changes to ingestion guarantees may need to be applied twice

#### Desired direction

Define a clearer single ingestion model for the platform, or explicitly
document and maintain the distinction between:

- direct API-managed ingestion
- orchestrator-managed ingestion triggered by channel/runtime events

### 4. The orchestrator still carries some responsibility concentration

The runtime architecture is strong, but the main processors remain operationally
dense:

- `apps/orchestrator/src/modules/processors/inbound-message.processor.ts`
- `apps/orchestrator/src/modules/processors/flow-execution.processor.ts`

The inbound processor still combines:

- tenant attachment
- metrics
- guardrails
- tracing
- analytics
- evaluation
- cost recording
- flow enqueueing

#### Impact

- changes in one concern can increase regression risk in the runtime entry point
- reasoning about failures requires understanding a large worker surface
- test coverage is strong, but maintenance cost remains high

#### Desired direction

Continue moving orchestration-adjacent concerns into smaller services without
changing the orchestrator-centered runtime model.

## Known Runtime vs API Boundary Issues

### 1. API remains both a management boundary and a runtime execution surface

The intended architecture places runtime message processing in the orchestrator.
That is true for channel-driven flows. However, the API still executes important
runtime-like work directly in:

- chat
- document ingestion
- search
- memory persistence and retrieval

This is not necessarily wrong, but it is a meaningful boundary blur.

#### Impact

- the API is not only administrative or management-oriented
- some user-facing behavior is synchronous and API-owned while other behavior is
  asynchronous and orchestrator-owned
- platform discussions need to explain both models clearly

#### Desired direction

Be explicit about whether the long-term architecture wants:

- an API that remains a first-class synchronous execution surface
- or an API that becomes primarily a management and supporting boundary for the
  orchestrator runtime

### 2. Internal API dependency remains central to orchestrator capabilities

The orchestrator depends on internal API clients for:

- document registration
- conversation reply handoff
- memory store/query
- search

This is implemented through:

- `apps/orchestrator/src/modules/internal-api/internal-api.module.ts`

#### Impact

- the orchestrator is operationally decoupled from channels, but not fully
  independent from API availability
- runtime health can still be limited by internal API latency or failure

#### Desired direction

Keep the boundary explicit and observable. Over time, decide whether this
dependency is part of the intended platform design or whether some capabilities
should move closer to the runtime itself.

### 3. The API application may need clearer separation of presentation,

runtime, and internal concerns

The current API application hosts multiple kinds of responsibilities in the
same application boundary:

- web and portal-facing endpoints used by the UI
- synchronous business or runtime-like entry points such as chat and document
  ingestion
- internal endpoints and capabilities used by orchestrator agents and tools

This does not make the current implementation incorrect. It does, however,
increase the chance of architectural drift because the same boundary can be
used for both user-facing presentation flows and internal platform operations.

The risk is visible in the current repository shape:

- the web application talks directly to API chat and ingestion flows
- the orchestrator also depends on API-backed internal capabilities
- the intended `orchestrator -> agents -> tools` runtime path is therefore not
  the only path through which business behavior can be reached

#### Impact

- it becomes easier for new web features to bypass the orchestrator runtime by
  adding direct API flows
- architectural ownership of business execution becomes less obvious over time
- internal platform operations and public-facing API concerns can evolve under
  different pressures while still sharing the same boundary

#### Desired direction

If the long-term platform direction is to validate agents and RAG as the core
runtime path, the architecture may eventually benefit from a clearer boundary
split such as:

- `api-web` for presentation or BFF-style endpoints consumed by the portal
- `api-runtime` for business entry points that should align with the agent and
  orchestrator runtime
- `api-internal` for platform operations used only by agents, tools, and other
  internal services

This is a future architectural improvement, not an implemented structure in the
current repository. The immediate debt is the lack of sharper separation inside
the current API boundary.

## Web Flows That May Bypass the Intended Agent/Runtime Path

These flows currently bypass the orchestrator path and use direct API behavior:

### Chat experience

- web entry:
  - `apps/web/src/features/chat/hooks/use-chat.ts`
  - `apps/web/src/features/chat/services/chat-api.service.ts`
- backend entry:
  - `apps/api-business/src/modules/chat/controllers/chat.controller.ts`
  - `apps/api-business/src/modules/chat/services/chat.service.ts`

### Document upload experience

- web entry:
  - `apps/web/src/features/documents/services/documents-api.service.ts`
- backend entry:
  - `apps/api-business/src/modules/ingestion/controllers/ingestion.controller.ts`
  - `apps/api-business/src/modules/ingestion/services/ingestion.service.ts`

### Why this matters

If the project’s main value proposition is agent-driven orchestration and
runtime-centered RAG, then these web flows are important architectural debt
because they validate a different operational path than the channel/orchestrator
flow.

## RAG and Document Ingestion Alignment Gaps

### 1. Retrieval persistence strategy is still hybrid

The orchestrator retrieval service uses internal API search as the primary path
and local vector storage as fallback:

- `apps/orchestrator/src/modules/rag/retrieval.service.ts`
- `apps/orchestrator/src/modules/rag/vector.repository.ts`

#### Impact

- the fallback is useful for resilience and tests
- it also means the persistence model is not fully singular
- behavior under scale and consistency expectations is still transitional

#### Desired direction

Converge on a clearer production retrieval model and keep fallback behavior
explicitly framed as fallback, not as a competing persistence strategy.

### 2. Orchestrator indexing uses simplified local embeddings

The orchestrator document indexer currently builds local embeddings through
`createEmbedding()` and mirrors indexed content into `VectorRepository`:

- `apps/orchestrator/src/modules/rag/document-indexer.service.ts`

The API ingestion flow uses the API embedding service and persists document data
through repository abstractions:

- `apps/api-business/src/modules/ingestion/services/ingestion.service.ts`

#### Impact

- indexing quality and persistence semantics are not fully unified
- the repository still reflects an evolving RAG implementation rather than one
  final ingestion/indexing model

#### Desired direction

Reduce the gap between API-managed document processing and orchestrator-managed
indexing so that ingestion, retrieval, and document registration are easier to
reason about as one platform capability.

## Multi-Tenancy, Idempotency, and Operational Gaps

### 1. Tenant fallback to `default-tenant` is still used in multiple paths

Examples:

- `apps/orchestrator/src/modules/tenancy/tenant-resolver.service.ts`
- `apps/api-business/src/common/tenancy/tenant-context.service.ts`
- `apps/api-business/src/modules/ingestion/services/ingestion.service.ts`
- `apps/orchestrator/src/modules/rag/document-indexer.service.ts`

#### Impact

- helpful for demos, local runs, and backwards-compatible flows
- risky for strict tenant isolation if fallback becomes normal operational
  behavior

#### Desired direction

Keep fallback behavior explicit and reduce reliance on implicit default tenants
in environments where isolation matters.

### 2. Idempotency exists, but not as a single end-to-end platform mechanism

The repository has a real idempotency service in the API omnichannel module:

- `apps/api-business/src/modules/omnichannel/application/services/idempotency.service.ts`

The orchestrator also reduces duplicate queue processing by using stable
`jobId`s and queue-level deduplication patterns.

However, there is not yet one centralized platform-wide idempotency mechanism
covering all entry points and downstream side effects.

#### Impact

- duplicate protection is better than zero, but still fragmented
- document ingestion, analytics, outbound response delivery, and replay
  scenarios can still rely on local protections rather than one unified model

#### Desired direction

Move toward an explicit end-to-end idempotency strategy covering:

- inbound event registration
- retry safety
- queue replay behavior
- downstream side effects

### 3. Local Docker runtime still depends on channel configuration details

The local Compose stack can still leave the orchestrator in a restart loop when
Telegram is enabled without the required credentials:

- `apps/orchestrator/src/modules/channels/telegram/listener/telegram.listener.ts`

#### Impact

- local stack startup is not fully self-healing
- new contributors can misinterpret configuration issues as runtime instability

#### Desired direction

Either make local startup defaults safer, or document the Telegram dependency
more explicitly as part of the runtime contract.

## Prioritization

## Must Address Soon

- Align the product story around whether web chat and document submission should
  go through the orchestrator/agent path or remain intentional direct API flows.
- Reduce the split between API RAG execution and orchestrator RAG execution.
- Define a clearer end-to-end idempotency strategy.
- Reduce operational dependence on `default-tenant` for flows that should be
  strictly tenant-scoped.

## Should Address Next

- Unify or better document the relationship between API ingestion and
  orchestrator document indexing.
- Continue reducing responsibility concentration in orchestrator processors.
- Clarify the long-term role of the internal API boundary inside the
  orchestrator runtime.
- Improve local runtime defaults for channel-enabled Docker startup.

## Can Wait

- Further cleanup of non-critical historical documentation that does not affect
  the main release-facing path.
- Secondary naming and structural improvements outside the main runtime and
  product paths.
- Additional ergonomics around demo and onboarding flows that do not change the
  core runtime architecture.

## Summary

The repository already demonstrates a credible architecture:

- clear monorepo boundaries
- a real orchestrator runtime
- domain-grouped channels
- real queue-driven execution
- working RAG, ingestion, memory, and observability surfaces

The remaining debt is mostly about convergence, not direction.

The biggest open question is not whether the platform has an architecture. It
does. The biggest open question is whether the orchestrator runtime is the
single intended core execution path, or whether direct API-powered RAG flows are
also a deliberate long-term product model.

That question drives several of the debts listed above and should remain visible
until the platform chooses one clearer center of gravity.
