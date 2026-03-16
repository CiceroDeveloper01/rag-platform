# Running Locally

[Home](Home) | [Testing Strategy](Testing-Strategy) | [Channel Integrations](Channel-Integrations)

## Local Topology

```mermaid
flowchart LR
    Web[apps/web] --> API[apps/api]
    API --> Postgres[(PostgreSQL)]
    API --> Redis[(Redis)]
    Orchestrator[apps/orchestrator] --> Redis
    Orchestrator --> API
    API --> OTel[OpenTelemetry Collector]
    Orchestrator --> OTel
```

## Minimum Flow

1. install dependencies
2. start infrastructure with Docker Compose
3. start `api`, `orchestrator`, and `web`
4. validate health endpoints
5. run targeted tests or exercise the Telegram path

## Important Note

If Telegram is enabled without credentials, the orchestrator will fail fast during startup.

Source:

- [docs/RUNNING_LOCALLY.md](../RUNNING_LOCALLY.md)
