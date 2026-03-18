# ADR-008 — API Boundary Separation

## Status

Accepted

## Context

The repository previously concentrated too many concerns in a single API boundary. As the platform matured, it became important to separate:

- portal-facing presentation and BFF concerns
- synchronous business/domain capabilities
- the asynchronous runtime

## Decision

Introduce and preserve the following boundaries:

- `apps/web`
- `apps/api-web`
- `apps/api-business`
- `apps/orchestrator`

`api-web` owns presentation-oriented concerns. `api-business` owns real business/domain APIs that already exist in the repository. `orchestrator` remains the async runtime.

## Consequences

### Positive

- clearer ownership
- better onboarding
- lower risk of mixing portal concerns with runtime logic

### Trade-offs

- some flows still need alignment and proxying work
- cross-boundary documentation becomes more important
