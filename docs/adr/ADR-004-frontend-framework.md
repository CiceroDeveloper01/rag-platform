# ADR-004 — Frontend Framework

## Status

Accepted

## Context

The project needs an operational frontend capable of acting as a real product surface, not just a demo page. The UI must support authentication, chat, document ingestion, observability shortcuts, and an omnichannel operations dashboard with charts, filters, and request details.

The frontend therefore needs:

- a modern routing model
- strong TypeScript support
- scalable component composition
- good API integration ergonomics
- support for a professional operator-facing dashboard

## Decision

Use **Next.js with React and TypeScript** as the frontend framework.

The application uses the App Router structure and a feature-oriented organization. React is used for UI composition, and TypeScript is used to keep shared contracts and API integrations strongly typed across the monorepo.

## Consequences

### Positive

- Provides a modern frontend foundation suitable for dashboards and operational tooling.
- Works well with server-rendered and client-rendered routes where appropriate.
- Integrates naturally with monorepo TypeScript packages and shared contracts.
- Enables a clean separation between routes, features, hooks, services, and shared UI components.
- Supports future growth into richer authenticated operator workflows.

### Trade-offs

- Introduces Next.js conventions that require architectural discipline.
- Build and runtime behavior can be more complex than a minimal SPA stack.
- Some dashboard pages still require careful client-side data orchestration to avoid unnecessary complexity.
- The project accepts this complexity to gain a robust and modern frontend foundation.
