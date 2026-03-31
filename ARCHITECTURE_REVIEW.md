# Architecture Review

This review reflects the architecture that exists today in the repository.

## Summary

The project has moved from a generic retrieval-oriented platform narrative to a more concrete architecture:

- `orchestrator` is the runtime coordinator
- `api-business` is the synchronous business core
- `api-web` remains the portal-facing BFF
- `web` is the user and operator interface
- the main business scenario implemented so far is the AI banking account manager

This is a healthier state than a purely conceptual multi-agent platform because there is now a real business domain behind the conversational flow.

## What Is Architecturally Strong

### Clear Role Separation

- `RAG` is used for knowledge
- `Tools` are used for action and deterministic business queries
- `Specialists` make contextual decisions
- `Guardrails` protect sensitive execution
- `Orchestrator` coordinates the runtime
- `api-business` owns business contracts

This separation reduces prompt-driven business logic and keeps execution paths explicit.

### Incremental Evolution

The banking scenario was added without rewriting the legacy runtime. That was the right move for the current repository because it preserved:

- the existing orchestrator flow
- the existing handoff pipeline
- current APIs and folder structure

### Real Business API Backing

The banking tools now consume `api-business` endpoints rather than remaining purely local mocks. This gives the account manager branch a real business boundary and makes the project more defensible from an architecture perspective.

## Current Architectural Strengths

- additive banking evolution instead of disruptive rewrite
- explicit `api-web` versus `api-business` split
- banking domain introduced under `api-business`
- specialist-driven orchestration in `orchestrator`
- multi-turn confirmation preserved in runtime state
- handoff uses the real handoff pipeline
- observability distinguishes `RAG` flows from `tool-only` flows

## Current Constraints and Honest Gaps

- banking data in `api-business` is still mock-backed
- some flows still rely on fallback entity selection when a user does not specify a concrete card or product
- only part of the future banking roadmap is integrated end-to-end
- the repository still mixes platform capabilities and business capabilities in the same `api-business` boundary, which is acceptable for now but may deserve later review

## Architectural Guidance Going Forward

The current direction should remain:

1. keep strengthening the banking domain in `api-business`
2. keep tools thin and deterministic
3. keep decision logic inside specialists and orchestration layers
4. keep RAG focused on knowledge, not execution
5. postpone larger structural separation discussions until more business capability exists

## Conclusion

The repository is in a materially better state now than a generic AI demo platform. It has:

- a credible business scenario
- a concrete orchestration model
- real API-backed tools
- explicit architecture boundaries

The next gains will come from deepening business integrations rather than from another broad architectural rewrite.
