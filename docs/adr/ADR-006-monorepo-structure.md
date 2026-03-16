# ADR-006 — Monorepo Structure

## Status

Accepted

## Context

RAG-PLATAFORM contains a backend API, a frontend dashboard, shared architectural concepts, infrastructure assets, and increasingly shared contracts and types. As the platform evolved, it became important to avoid duplicated request/response contracts, status enums, and utility functions between applications.

The project therefore needed a repository structure that could:

- keep backend and frontend together
- support shared TypeScript contracts and utilities
- simplify local development and CI
- preserve architectural consistency across applications

## Decision

Adopt a **monorepo structure** with the following top-level organization:

```text
apps/
  api
  web

packages/
  contracts
  types
  utils
```

The backend and frontend remain independently deployable applications, while `packages/` contains framework-agnostic shared artifacts used by both apps.

The monorepo also keeps documentation, infrastructure, and CI assets close to the code they support.

## Consequences

### Positive

- Reduces duplication between frontend and backend for shared contracts and types.
- Improves consistency for API payloads and dashboard data models.
- Makes CI, Docker, and documentation easier to manage in one repository.
- Supports incremental architecture evolution without splitting platform context across repositories.
- Improves developer experience through shared tooling and aligned TypeScript configuration.

### Trade-offs

- Requires care around workspace configuration, TypeScript paths, and package boundaries.
- Can increase repository complexity compared with a single-app codebase.
- Demands discipline to avoid leaking app-specific logic into shared packages.
- The project accepts this trade-off to preserve consistency and reduce duplication over time.
