# C4 Model

## Purpose

The C4 Model is a lightweight way to describe software architecture at multiple levels of abstraction.

Instead of mixing every concern into a single diagram, it separates the architecture into progressively more detailed views. This makes the system easier to understand for engineers, operators, and stakeholders who need different levels of context.

For RAG-PLATAFORM, the C4 documentation is used to explain:

- how the platform fits into its wider ecosystem
- which major runtime containers make up the solution
- how the main backend components collaborate internally

## Levels in this project

- **System Context**: shows the main actors and external systems around RAG-PLATAFORM
- **Container Diagram**: shows the primary runtime containers and infrastructure services
- **Component Diagram**: shows the main internal backend components inside `apps/api-business`

## Documents

- [System Context](system-context.md)
- [Container Diagram](container-diagram.md)
- [Component Diagram](component-diagram.md)

## Scope note

These documents reflect the current architecture already implemented in the repository, including:

- `apps/api-business` as the NestJS backend
- `apps/web` as the Next.js operational dashboard
- PostgreSQL with `pgvector`
- the omnichannel / MCP orchestration model
- the existing RAG retrieval pipeline
- the observability stack used in local Docker environments

The goal is architectural clarity, not exhaustive runtime documentation.
