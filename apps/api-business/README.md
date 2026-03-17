# API Business

`apps/api-business` is the synchronous business-facing NestJS API.

It owns the repository-backed capabilities that already exist in the platform today, including:

- chat
- documents
- document ingestion
- search and retrieval
- conversations and memory
- internal endpoints used by the orchestrator runtime

This app is intentionally separate from:

- `apps/web`, which remains UI-only
- `apps/api-web`, which is the portal-facing presentation and BFF-oriented API layer
- `apps/orchestrator`, which remains the asynchronous runtime for agents, queues, channels, and tools
