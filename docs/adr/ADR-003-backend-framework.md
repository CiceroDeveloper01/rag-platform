# ADR-003 — Backend Framework

## Status

Accepted

## Context

The backend of Intelligent Automation Platform is responsible for several non-trivial concerns:

- modular business domains
- session-based authentication
- knowledge retrieval execution and document ingestion
- omnichannel orchestration
- dashboard and analytics queries
- observability and operational endpoints

The project required a framework that could support explicit modularity, clean composition, dependency injection, validation, and scalable service organization without forcing a heavily custom runtime foundation.

## Decision

Use **NestJS with TypeScript** as the backend framework.

NestJS is used as the application framework for:

- modular domain organization
- dependency injection
- controllers and transport composition
- configuration management
- interceptors, filters, guards, and validation
- testable service and repository boundaries

TypeScript remains the implementation language across the backend to maintain consistency with the frontend and shared monorepo packages.

## Consequences

### Positive

- Provides a clear modular structure for domains such as auth, chat, documents, search, conversations, and omnichannel.
- Includes native dependency injection and strong support for layered architecture.
- Makes cross-cutting concerns such as logging, metrics, filters, and validation easier to centralize.
- Aligns well with the project's Clean Architecture-inspired service and repository model.
- Improves maintainability for a platform expected to evolve over time.

### Trade-offs

- Adds framework conventions that require discipline and familiarity from contributors.
- Can introduce boilerplate if used without architectural restraint.
- Some framework abstractions may feel heavier than minimalist Node.js approaches for very small services.
- The project accepts this additional structure in exchange for long-term clarity and scalability.
