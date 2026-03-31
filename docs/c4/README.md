# C4 Model

## Purpose

The C4 Model is a lightweight way to describe software architecture at multiple levels of abstraction.

Instead of mixing every concern into a single diagram, it separates the architecture into progressively more detailed views. This makes the system easier to understand for engineers, operators, and stakeholders who need different levels of context.

For Intelligent Automation Platform, the C4 documentation is used to explain:

- how the platform fits into its wider ecosystem
- which major runtime containers make up the solution
- how the main backend components collaborate internally

## Levels in this project

- **System Context**: shows the main actors and external systems around Intelligent Automation Platform
- **Container Diagram**: shows the primary runtime containers and infrastructure services
- **Component Diagram**: shows the main platform components across `apps/api-web`, `apps/api-business`, and `apps/orchestrator`

## Documents

- [System Context](system-context.md)
- [Container Diagram](container-diagram.md)
- [Component Diagram](component-diagram.md)

## Scope note

These documents reflect the current architecture already implemented in the repository, including:

- `apps/api-web` as the portal-facing NestJS BFF
- `apps/api-business` as the synchronous business API
- `apps/orchestrator` as the asynchronous runtime
- `apps/web` as the Next.js operational dashboard
- RabbitMQ for asynchronous document ingestion
- PostgreSQL with `pgvector`
- the omnichannel and agent runtime model
- the existing knowledge retrieval capability
- the observability stack used in local Docker environments

The goal is architectural clarity, not exhaustive runtime documentation.
