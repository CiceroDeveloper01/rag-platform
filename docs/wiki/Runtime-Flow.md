# Runtime Flow

[Home](Home) | [Agent Architecture](Agent-Architecture) | [Channel Integrations](Channel-Integrations)

## Runtime Message Flow

```mermaid
sequenceDiagram
    participant Channel as Channel Listener
    participant InboundQ as inbound-messages
    participant Inbound as InboundMessageProcessor
    participant Graph as AgentGraphService
    participant FlowQ as flow-execution
    participant Flow as FlowExecutionProcessor
    participant Outbound as Outbound Service

    Channel->>InboundQ: enqueue canonical inbound payload
    InboundQ->>Inbound: deliver inbound job
    Inbound->>Inbound: tenant resolution, guardrails, traces
    Inbound->>Graph: execute(inboundMessage)
    Graph-->>Inbound: decision and executionRequest
    Inbound->>FlowQ: enqueue downstream job
    FlowQ->>Flow: deliver flow job
    Flow->>Outbound: send response when enabled
```

## Current Runtime Roles

- `InboundMessageProcessor`
  - validates inbound jobs
  - resolves tenant context
  - emits metrics and traces
  - calls the graph
  - enqueues the flow-execution stage
- `FlowExecutionProcessor`
  - handles downstream response execution
  - registers documents
  - routes outbound delivery
  - respects safe-mode toggles

Source:

- [docs/ARCHITECTURE.md](/home/cicero/projects/rag-platform/docs/ARCHITECTURE.md)
- [docs/runtime-flow.md](/home/cicero/projects/rag-platform/docs/runtime-flow.md)
