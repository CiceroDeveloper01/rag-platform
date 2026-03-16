# Testing Strategy

[Home](Home) | [Running Locally](Running-Locally) | [Runtime Flow](Runtime-Flow)

The project includes:

- unit tests
- integration tests
- end-to-end tests for critical flows

Highest-confidence areas today:

- orchestrator critical runtime path
- Telegram-centric runtime behavior
- agent routing
- document ingestion
- RAG retrieval
- feature toggle ON/OFF behavior

```mermaid
flowchart TD
    Unit[Unit tests] --> Integration[Integration tests]
    Integration --> E2E[End-to-end tests]
    E2E --> CriticalPaths[Critical runtime scenarios]
    CriticalPaths --> Routing[Routing]
    CriticalPaths --> Ingestion[Ingestion]
    CriticalPaths --> Retrieval[Retrieval]
    CriticalPaths --> Toggles[Toggles]
```

## Known Gaps

- stronger end-to-end duplicate event handling
- broader tenant-isolation coverage
- broader API hardening outside the most critical flows

Source:

- [docs/TESTING_GUIDE.md](../TESTING_GUIDE.md)
