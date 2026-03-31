# Technical Debt and Architectural Gaps

## Purpose

This register documents technical and architectural debt that is visible in the current repository. It focuses on real issues and trade-offs, not cosmetic cleanup.

## Current Context

The monorepo now has clearer boundaries:

- `apps/web`
- `apps/api-web`
- `apps/api-business`
- `apps/orchestrator`

The repository also now has an explicit asynchronous document ingestion path using RabbitMQ and persisted document status.

That direction is solid. The remaining debt is mostly about boundary alignment, duplicated execution paths, and operational hardening.

## Known Architectural Debt

### 1. Some web flows still bypass the intended long-term API boundary model

The architecture now distinguishes `api-web` from `api-business`, but the overall web integration story is still transitional.

The web application still contains flows that are not uniformly aligned behind a single portal-facing API boundary. Chat, document management, and operational views are not yet fully consolidated into one clean `web -> api-web -> api-business` model.

#### Impact

- onboarding requires explaining more than one web-to-API path
- new UI work can still drift toward direct business API coupling
- the architecture split exists, but some usage patterns are still catching up

#### Desired direction

Keep moving portal-facing flows behind `api-web` where that boundary adds value, while preserving `api-business` as the business capability boundary.

### 2. RAG execution remains split across synchronous and asynchronous paths

The repository still has more than one real path that can exercise retrieval-oriented behavior:

- synchronous business API chat
- orchestrator-driven retrieval and response planning

#### Impact

- RAG behavior can diverge by entry point
- tuning retrieval can require touching more than one path
- observability and troubleshooting are more complex than a single reference path

#### Desired direction

Make the long-term reference path more explicit, or further align the synchronous and asynchronous knowledge retrieval flows.

### 3. Document ingestion is clearer now, but not fully unified yet

The new RabbitMQ-backed document flow is a major improvement, but the repository still carries multiple document entry patterns:

- web-origin upload
- channel-origin document handoff
- internal API callbacks for status changes

#### Impact

- the architecture is better, but still not minimal
- there are more transition points to reason about
- onboarding still requires explaining how channel-origin documents become business-owned ingestion requests

#### Desired direction

Keep the current split, but continue converging on a single canonical ingestion story with fewer special-case transitions.

### 4. Channel-origin asynchronous ingestion still relies on already-available extracted content

The current channel-origin async flow uses the text or extracted content already available in the runtime before publishing ingestion work.

That is a valid incremental design, but it is not the same as a provider-native raw-binary ingestion subsystem for every channel.

#### Impact

- some provider-specific document fidelity limits may still exist
- architecture discussions should be honest about what is actually implemented

#### Desired direction

Only if needed, evolve channel-specific raw file handling further without moving business logic back into the channel layer.

### 5. Processor responsibility concentration still exists in the orchestrator

`InboundMessageProcessor` and `FlowExecutionProcessor` remain dense operational components.

#### Impact

- regression risk is higher at the runtime entry points
- failures can require understanding a large amount of logic in one place

#### Desired direction

Keep decomposing operational concerns into smaller services while preserving the orchestrator-centered runtime.

## Runtime vs API Boundary Gaps

### `api-web` vs `api-business` is improved, but not fully finished

The split now exists structurally. That is good. But the boundary is still being operationally normalized.

`api-web` now proxies document-related portal flows and owns portal-facing surfaces. `api-business` owns the actual business capabilities. The remaining debt is adoption consistency, not the absence of the split.

### Internal API dependency remains a real orchestrator dependency

The orchestrator still depends on internal API endpoints for status updates and business-facing persistence.

#### Impact

- runtime health still depends on `api-business` availability and latency
- this is an intentional architecture choice, but it should remain observable and explicit

## Multi-Tenancy, Idempotency, and Operational Gaps

### Multi-tenancy

Tenant propagation exists, but full hardening still deserves more coverage and validation across every surface.

### Idempotency

End-to-end idempotency is still not centralized across the whole platform. That remains a meaningful production concern.

### Operational hardening

The repository now has bounded retry, DLQ routing, persisted retry metadata, and explicit replay for document ingestion. The remaining debt is narrower now: broader reconciliation tooling and stronger idempotency consistency across every async path in the platform.

## Prioritization

### Must address soon

- continue aligning web-facing flows with the intended `api-web` and `api-business` boundaries
- strengthen end-to-end idempotency for non-document async flows and channel delivery paths
- keep documenting the current limits of channel-origin document handling honestly

### Should address next

- reduce competing RAG execution paths
- keep decomposing dense orchestrator processors
- strengthen tenant isolation verification and operational tests

### Can wait

- deeper provider-specific document ingestion sophistication
- broader unification of all UI flows once the platform boundaries stabilize further
