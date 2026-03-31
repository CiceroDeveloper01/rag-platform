# Home

Welcome to the Intelligent Automation Platform Wiki.

This project is a TypeScript monorepo for intelligent automation through an asynchronous runtime. The platform combines channel integrations, queue-based execution, decision orchestration, document ingestion, knowledge retrieval, conversation memory, feature toggles, and operational observability.

## Key Concepts

- `agent-first runtime`
- `channel-agnostic messaging`
- `orchestrator-centered execution`
- `BullMQ queues`
- `document ingestion and retrieval`
- `feature toggles with safe degradation`
- `observability across the critical runtime path`

```mermaid
flowchart LR
    Channel[Channels] --> Adapter[Channel Adapters]
    Adapter --> InboundQ[inbound-messages]
    InboundQ --> Orchestrator[Orchestrator Runtime]
    Orchestrator --> Agents[Agent Graph and Agents]
    Agents --> FlowQ[flow-execution]
    FlowQ --> Outbound[Outbound Services]
```

## Wiki Navigation

- [Architecture Overview](Architecture-Overview)
- [System Architecture](System-Architecture)
- [Runtime Flow](Runtime-Flow)
- [Agent Architecture](Agent-Architecture)
- [Queue Topology](Queue-Topology)
- [Document Processing](Document-Processing)
- [Knowledge Retrieval Capability](RAG-Architecture)
- [Feature Toggles](Feature-Toggles)
- [Observability](Observability)
- [Testing Strategy](Testing-Strategy)
- [Running Locally](Running-Locally)
- [Channel Integrations](Channel-Integrations)
- [Database Model](Database-Model)
- [Architecture Decisions](Architecture-Decisions)

## Repository Documentation

Canonical repository documents:

- [docs/ARCHITECTURE.md](../ARCHITECTURE.md)
- [docs/ARCHITECTURE_DECISIONS.md](../ARCHITECTURE_DECISIONS.md)
- [docs/RUNNING_LOCALLY.md](../RUNNING_LOCALLY.md)
- [docs/TESTING_GUIDE.md](../TESTING_GUIDE.md)
- [docs/CHANNEL_INTEGRATION.md](../CHANNEL_INTEGRATION.md)
- [docs/DATABASE.md](../DATABASE.md)
