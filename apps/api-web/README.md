# API Web

`apps/api-web` is the portal-facing NestJS API boundary.

It currently groups the presentation and operator surfaces that already exist in the repository, including:

- authentication
- analytics
- agent traces
- health
- omnichannel operator dashboards and execution monitoring
- simulation tooling

This app is intentionally separate from:

- `apps/web`, which remains UI-only
- `apps/api-business`, which owns business-facing document, search, chat, ingestion, memory, and internal platform capabilities
- `apps/orchestrator`, which remains the asynchronous runtime
