# Roadmap

This roadmap reflects the repository after the banking scenario was introduced and after the first two implementation phases were completed.

## Current Position

Delivered so far:

- monorepo application split across `web`, `api-web`, `api-business`, and `orchestrator`
- generic platform capabilities such as chat, search, documents, memory, and ingestion
- banking account manager branch in the orchestrator
- `banking` domain in `api-business`
- real tool integration from orchestrator to `api-business`
- multi-turn confirmation, handoff reuse, and corrected tool-only observability

## Completed Milestones

### Banking Phase 1

Completed:

- supervisor routing into the banking branch
- account manager orchestration
- decision layer
- initial specialists
- response composer
- handoff reuse
- multi-turn confirmation for sensitive operations

### Banking Phase 2

Completed:

- banking tools layer in orchestrator
- basic guardrail service
- real integration from tools to `api-business`
- cards and investments connected in active specialist flows
- customer and credit tools prepared for broader usage
- observability aligned for tool-only versus knowledge-assisted flows

## Next Likely Steps

### Banking Phase 3

Expected focus:

- replace mock-backed banking services with persistent repositories or external integrations
- expand specialist usage of customer and credit tools
- improve explicit product and entity resolution
- deepen metrics, tracing, and operational dashboards for banking flows

### Banking Phase 4

Expected focus:

- broaden banking domains still pending full implementation
- deepen handoff workflows and operator tooling
- refine specialist strategies and fallback behavior
- continue hardening internal service boundaries

## Longer-Term Architectural Review

A later discussion may revisit whether the repository should draw a cleaner distinction between:

- platform capabilities such as chat, search, documents, memory, and ingestion
- banking core business domains

That is intentionally not the focus of the current phase. The current priority remains expanding real business capability first.
