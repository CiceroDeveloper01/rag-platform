# ADR-006 — Monorepo Structure

## Status

Accepted

## Context

The platform now contains multiple application boundaries with different responsibilities:

- `apps/web`
- `apps/api-web`
- `apps/api-business`
- `apps/orchestrator`

The repository also contains shared contracts, SDK clients, observability helpers, and configuration packages.

The monorepo structure must therefore:

- preserve strict application ownership
- keep shared code truly shared
- avoid moving app-specific logic into generic packages
- support local development, CI, Docker, and documentation in one place

## Decision

Adopt a monorepo structure with explicit application boundaries:

```text
apps/
  web
  api-web
  api-business
  orchestrator

packages/
  contracts
  shared
  sdk
  config
  observability
  types
  utils
```

Only framework-agnostic, truly cross-application code belongs in `packages/`.

## Consequences

### Positive

- clearer ownership for UI, BFF, business APIs, and async runtime
- easier onboarding and code navigation
- less architectural drift across application boundaries
- shared contracts remain explicit

### Trade-offs

- more application boundaries require more discipline around imports and ownership
- some transitions still need proxying or internal SDK clients
- documentation must stay current so the split remains understandable
