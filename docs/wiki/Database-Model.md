# Database Model

[Home](Home) | [Knowledge Retrieval Capability](RAG-Architecture) | [Architecture Overview](Architecture-Overview)

This page is derived strictly from the SQL migrations under `database/migrations/`.

## Scope

The migrations clearly define:

- knowledge source and chunk storage
- authentication and conversations
- omnichannel messaging and execution tracking
- inbound message journaling
- evaluation and feedback
- tenant and agent configuration
- usage metrics

## Verified ER Diagram

```mermaid
erDiagram
    USERS ||--o{ AUTH_SESSIONS : "has"
    USERS ||--o{ CONVERSATIONS : "owns"
    CONVERSATIONS ||--o{ CONVERSATION_MESSAGES : "contains"
    USERS ||--o{ QUERIES : "creates"
    CONVERSATIONS ||--o{ QUERIES : "groups"
    SOURCES ||--o{ DOCUMENTS : "contains"
    OMNICHANNEL_MESSAGES ||--o{ OMNICHANNEL_EXECUTIONS : "produces"
    EXECUTIONS ||--o{ EXECUTION_EVENTS : "emits"
    TENANTS ||--o{ TENANT_AGENTS : "configures"
```

## Important Limitations

The migrations do not prove a complete foreign-key graph for every logical relationship in the application. For example:

- `documents.tenant_id` is indexed but not declared as a foreign key to `tenants`
- `ai_usage_metrics.tenant_id` is not declared as a foreign key
- `simulation_results.scenario_id` is not declared as a foreign key
- `conversation_memory.conversation_id` is stored as text, not as a foreign key

```mermaid
flowchart LR
    Inbound[(inbound_messages)] --> OmniMsg[(omnichannel_messages)]
    OmniMsg --> OmniExec[(omnichannel_executions)]
    OmniMsg --> Exec[(executions)]
    Exec --> ExecEvents[(execution_events)]
```

Source:

- [docs/DATABASE.md](../DATABASE.md)
- [database/migrations](../../database/migrations)
