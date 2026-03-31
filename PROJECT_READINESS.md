# Project Readiness

This document summarizes what is currently consolidated in the repository and what still remains in evolution.

It should be read as a practical readiness snapshot, not as a promise that every roadmap item is complete.

## Current Shape of the Repository

The repository is now organized around four main applications:

- `apps/web`
- `apps/api-web`
- `apps/api-business`
- `apps/orchestrator`

The current showcased business scenario is a banking assistant where an AI Account Manager coordinates specialists, knowledge retrieval, tools, guardrails, and handoff inside an Intelligent Automation Platform.

## What Is Consolidated

### Platform Boundaries

- `api-business` is the synchronous business core
- `api-web` is the web-facing BFF
- `orchestrator` is the async runtime and conversational coordinator
- `web` is the user and operator interface

### Banking Scenario

- banking branch in the orchestrator
- account manager orchestration
- decision layer
- specialists for banking domains
- response composition
- real handoff reuse
- multi-turn confirmation for sensitive card operations

### Business Integration

- `api-business` contains a `banking` module
- current subdomains are `cards`, `investments`, `customer`, and `credit`
- orchestrator tools already consume real `api-business` banking endpoints

### Observability

- tool-only flows do not create artificial LLM cost attribution
- RAG and tool flows are distinguished at runtime
- correlation is propagated through orchestrator and business integration paths

## What Is Still Evolving

- banking services in `api-business` still use mock-backed, in-memory data
- some flows still rely on default entity selection when the user does not identify a specific card or product
- broader banking domains such as debt negotiation are not yet fully connected to real business integrations
- the repository still contains platform capabilities that may later be separated conceptually from banking core, but that discussion is intentionally deferred

## Readiness by Area

### Ready for Demo and Technical Review

- banking orchestration narrative
- end-to-end specialist and tool flow
- real `api-business` contracts behind the current tools
- handoff and multi-turn explanation
- architecture review and interview/demo storytelling

### Partially Ready for Production-Like Evolution

- banking API contracts and module structure
- observability model for mixed RAG and tool flows
- clean separation between orchestration and business execution

### Not Yet Production Complete

- persistent banking repositories and external business integrations
- complete domain coverage across all planned specialists
- broader operational hardening for every banking scenario

## Recommended Near-Term Focus

1. replace mock-backed banking services with repository or integration-backed implementations
2. improve explicit entity resolution for cards and other products
3. continue expanding specialist coverage over real business endpoints
4. keep documentation aligned with each delivered banking phase

## Related Documents

- [Architecture](docs/ARCHITECTURE.md)
- [Banking Architecture](docs/banking-architecture.md)
- [Observability Guide](docs/observability/OBSERVALITY.md)
- [Roadmap](docs/roadmap/ROADMAP.md)
