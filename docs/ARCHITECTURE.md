# Platform Architecture

## 1. System Overview

This repository implements a TypeScript monorepo for orchestrating AI agents through an asynchronous runtime. External channels normalize inbound events, queues decouple intake from execution, and the orchestrator decides whether the system should answer, ingest a document, retrieve context, or hand off execution.

The current implementation follows these principles:

- `agent-first`: runtime decisions are made through agents
- `channel-agnostic`: channels normalize transport payloads, but do not own business logic
- `orchestrator-centered`: the asynchronous runtime lives in `apps/orchestrator`
- `event-driven`: BullMQ queues decouple message intake from downstream execution

```mermaid
flowchart LR
    Channel[Channels] --> Adapter[Channel Adapters]
    Adapter --> InboundQ[inbound-messages queue]
    InboundQ --> InboundProcessor[InboundMessageProcessor]
    InboundProcessor --> Graph[AgentGraphService]
    Graph --> Supervisor[Supervisor Agent]
    Supervisor --> ConversationAgent[conversation-agent]
    Supervisor --> DocumentAgent[document-agent]
    Supervisor --> HandoffAgent[handoff-agent]
    ConversationAgent --> FlowQ[flow-execution queue]
    DocumentAgent --> FlowQ
    HandoffAgent --> FlowQ
    FlowQ --> FlowProcessor[FlowExecutionProcessor]
    FlowProcessor --> Tools[Tools]
    Tools --> Context[RAG and Conversation Memory]
    FlowProcessor --> Outbound[Outbound Channel Services]
```

## 2. Monorepo Structure

### Applications

- `apps/api`
  - synchronous NestJS API
  - management, analytics, document, search, memory, health, and administrative surfaces
- `apps/web`
  - Next.js application
  - dashboards, chat screens, omnichannel command center, and operator views
- `apps/orchestrator`
  - asynchronous runtime
  - listeners, adapters, queues, processors, agents, tools, guardrails, traces, and outbound routing

### Packages

- `packages/contracts`
  - canonical contracts, DTOs, events, and queue payload types
- `packages/shared`
  - shared primitives used across applications
- `packages/sdk`
  - internal API clients used mainly by the orchestrator
- `packages/config`
  - configuration helpers and validation utilities
- `packages/observability`
  - logger, metrics, tracing, and observability helpers
- `packages/types`
  - shared platform types
- `packages/utils`
  - shared utility functions

```mermaid
flowchart TD
    subgraph Apps
        API[apps/api]
        ORCH[apps/orchestrator]
        WEB[apps/web]
    end

    subgraph Packages
        CONTRACTS[packages/contracts]
        SHARED[packages/shared]
        SDK[packages/sdk]
        CONFIG[packages/config]
        OBS[packages/observability]
        TYPES[packages/types]
        UTILS[packages/utils]
    end

    WEB --> CONTRACTS
    WEB --> TYPES
    WEB --> UTILS
    ORCH --> CONTRACTS
    ORCH --> SDK
    ORCH --> CONFIG
    ORCH --> OBS
    API --> CONTRACTS
    API --> CONFIG
    API --> OBS
```

## 3. Core Architecture

The runtime path implemented in the repository is:

`Channels -> Channel Adapter -> Inbound Queue -> Orchestrator Runtime -> Supervisor Agent -> Specialized Agents -> Tools -> RAG / Memory -> Response Generation -> Outbound Channel`

Layer responsibilities:

- `Channels`
  - receive external events
- `Channel Adapter`
  - convert provider payloads into canonical internal payloads
- `Inbound Queue`
  - decouple channel intake from runtime execution
- `Orchestrator Runtime`
  - resolve tenant context, enforce guardrails, emit traces, and run the agent graph
- `Supervisor Agent`
  - choose the specialized agent
- `Specialized Agents`
  - plan document, conversation, or handoff execution
- `Tools`
  - execute technical work such as parsing, chunking, embedding generation, retrieval, and storage
- `RAG / Memory`
  - provide additional context when enabled
- `Response Generation`
  - materialize the downstream execution request and compose the response
- `Outbound Channel`
  - deliver the final response through the right transport service

## 4. Queue Topology

The orchestrator uses two BullMQ queues in the main runtime path.

### `inbound-messages`

- queue constants live in `apps/orchestrator/src/modules/queue/queue.constants.ts`
- receives canonical inbound payloads from channel listeners
- `jobId` is derived from `channel:externalMessageId`
- uses configurable concurrency, attempts, backoff, and retention

### `flow-execution`

- receives the downstream execution request after agent planning
- `jobId` is derived from `jobName:channel:externalMessageId`
- also uses configurable attempts, backoff, and retention

### Retry and DLQ

- both queues use BullMQ retry policies with exponential backoff
- non-final failures remain in the retry path
- final failures are packaged and sent to the Dead Letter Queue service

```mermaid
flowchart TD
    ChannelListener[Channel Listener] --> InboundQueue[inbound-messages]
    InboundQueue -->|success| InboundProcessor[InboundMessageProcessor]
    InboundQueue -->|retry with exponential backoff| InboundQueue
    InboundProcessor --> FlowQueue[flow-execution]
    FlowQueue -->|success| FlowProcessor[FlowExecutionProcessor]
    FlowQueue -->|retry with exponential backoff| FlowQueue
    InboundProcessor -->|final failure| InboundDLQ[inbound-messages-dlq]
    FlowProcessor -->|final failure| FlowDLQ[flow-execution-dlq]
```

## 5. Orchestrator Runtime

### `InboundMessageProcessor`

`apps/orchestrator/src/modules/processors/inbound-message.processor.ts`

Current responsibilities:

- validate supported inbound job names
- resolve tenant context through `TenantContextMiddleware`
- increment inbound metrics
- run prompt-injection protection
- publish agent trace events
- call `AgentGraphService`
- publish analytics events
- validate policy and action payloads
- optionally run evaluation and cost monitoring
- enqueue the `flow-execution` stage
- package final failures for the inbound DLQ

This worker is operationally effective, but it still concentrates a large amount of orchestration work.

### `FlowExecutionProcessor`

`apps/orchestrator/src/modules/processors/flow-execution.processor.ts`

Current responsibilities:

- handle downstream flow jobs after agent planning
- call response composition logic
- register documents
- route outbound messages
- respect outbound feature toggles
- package final failures for the flow DLQ

### Runtime Message Flow

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
    Inbound->>Inbound: resolve tenant + guardrails + traces
    Inbound->>Graph: execute(inboundMessage)
    Graph-->>Inbound: decision + executionRequest
    Inbound->>FlowQ: enqueue executionRequest
    FlowQ->>Flow: deliver flow job
    Flow->>Outbound: send response if enabled
```

## 6. Agent Graph

`apps/orchestrator/src/modules/agents/agent.graph.ts`

`AgentGraphService` is the coordination layer that turns a canonical inbound message into a downstream execution request.

Execution model:

1. the inbound processor sends the canonical payload to the graph
2. the supervisor selects the target agent
3. the selected agent plans the action and context
4. the graph returns an `executionRequest`
5. the runtime enqueues `flow-execution`

Current specialized agents:

- `SupervisorAgent`
- `conversation-agent`
- `document-agent`
- `handoff-agent`

```mermaid
flowchart TD
    Start[Canonical inbound payload] --> Supervisor[SupervisorAgent]
    Supervisor -->|text and conversational intent| Conversation[conversation-agent]
    Supervisor -->|document payload| Document[document-agent]
    Supervisor -->|handoff scenario| Handoff[handoff-agent]
    Conversation --> Request[executionRequest]
    Document --> Request
    Handoff --> Request
    Request --> FlowQueue[flow-execution queue]
```

## 7. Channel Integrations

Telegram is the most mature channel in the repository.

Key Telegram components:

- `TelegramInboundAdapter`
- `TelegramPollingService`
- `TelegramListener`
- `TelegramOutboundService`

Current principle:

- channels normalize and publish
- channels do not decide agents
- channels do not perform document ingestion or retrieval
- outbound delivery stays separated from decision logic

```mermaid
flowchart LR
    TelegramAPI[Telegram API] --> Polling[TelegramPollingService]
    Polling --> Adapter[TelegramInboundAdapter]
    Adapter --> Listener[TelegramListener]
    Listener --> InboundQ[inbound-messages]
    FlowProcessor[FlowExecutionProcessor] --> TelegramOutbound[TelegramOutboundService]
    TelegramOutbound --> TelegramAPI
```

Email and WhatsApp exist in the current architecture, but they are still less mature operationally than Telegram.

## 8. Document Processing Pipeline

Document ingestion is planned by `document-agent` and executed through reusable tools.

What the repository clearly implements today:

- reception of document metadata in canonical inbound payloads
- document-oriented planning through `document-agent`
- download and parsing tools
- chunking and embedding generation
- storage and index registration

What is still evolving:

- full enterprise-grade binary lifecycle management
- stronger reconciliation for partial failures
- broader provider-specific storage hardening

```mermaid
flowchart TD
    InboundDoc[Inbound document payload] --> Supervisor[SupervisorAgent]
    Supervisor --> DocumentAgent[document-agent]
    DocumentAgent --> RegisterJob[flow-execution register-document job]
    RegisterJob --> Download[Download tool]
    Download --> Parse[Parsing tool]
    Parse --> Chunk[Chunking]
    Chunk --> Embed[Embedding generation]
    Embed --> Store[Document storage and registration]
    Store --> Index[RAG index update]
```

## 9. RAG Architecture

The repository currently supports:

- chunked document storage in PostgreSQL with `pgvector`
- a `documents` table with `VECTOR(1536)` embeddings
- a `rag_documents` table used by the orchestrator-side retrieval path
- retrieval context assembly in the orchestrator
- safe fallback behavior when retrieval is disabled

The vector persistence layer is functional, but still evolving for larger-scale production scenarios.

```mermaid
flowchart LR
    UserQuestion[User question] --> ConversationAgent[conversation-agent]
    ConversationAgent --> Retrieval[Retrieval service]
    Retrieval --> APISearch[API search path]
    Retrieval --> LocalFallback[Local fallback repository]
    APISearch --> Context[retrievedDocuments]
    LocalFallback --> Context
    Context --> ConversationAgent
    ConversationAgent --> Response[LLM context and response plan]
```

## 10. Conversation Memory

Conversation memory exists as a tenant-aware context store used by the orchestrator when the capability is enabled.

Current state:

- retrieval and persistence logic exist
- memory is integrated into the orchestrator runtime
- memory can be disabled by feature toggle
- the subsystem is still less mature than the core Telegram and queue flows

```mermaid
flowchart LR
    Inbound[Inbound message] --> TenantScope[Tenant resolution]
    TenantScope --> MemoryService[Conversation memory service]
    MemoryService --> MemoryStore[(conversation_memory)]
    MemoryStore --> MemoryContext[Recent and semantic memory]
    MemoryContext --> Agent[conversation-agent]
```

## 11. Feature Toggles

The current runtime supports explicit production-oriented toggles, including:

- `TELEGRAM_ENABLED` / listener-level Telegram settings
- `DOCUMENT_INGESTION_ENABLED`
- `DOCUMENT_PARSING_ENABLED`
- `RAG_RETRIEVAL_ENABLED`
- `CONVERSATION_MEMORY_ENABLED`
- `EVALUATION_ENABLED`
- `OUTBOUND_SENDING_ENABLED`
- `TRAINING_PIPELINE_ENABLED`

Safe degradation behavior already implemented:

- disabled ingestion skips document side effects
- disabled parsing falls back safely
- disabled retrieval returns no retrieved documents
- disabled memory returns empty context
- disabled evaluation skips evaluation side effects
- disabled outbound sending logs and skips delivery

```mermaid
flowchart TD
    Job[Inbound or flow job] --> ToggleCheck{Feature enabled?}
    ToggleCheck -->|Yes| NormalPath[Run capability normally]
    ToggleCheck -->|No| SafeSkip[Skip capability safely]
    SafeSkip --> Trace[Publish trace and metrics]
    SafeSkip --> Continue[Continue predictable control flow]
```

## 12. Observability

The repository includes:

- structured application logging
- Prometheus-style metrics
- OpenTelemetry tracing
- dedicated agent trace events
- queue-related failure and throughput metrics
- cost and evaluation analytics in the orchestrator path

The main observability stack referenced by the repository is:

- OpenTelemetry
- Prometheus
- Grafana
- Tempo
- Loki

```mermaid
flowchart LR
    Runtime[API and Orchestrator Runtime] --> Logs[Structured Logs]
    Runtime --> Metrics[Metrics]
    Runtime --> Traces[Distributed Traces]
    Runtime --> AgentTraces[Agent Trace Events]
    Logs --> Loki[Loki]
    Metrics --> Prometheus[Prometheus]
    Traces --> Tempo[Tempo]
    Prometheus --> Grafana[Grafana]
    Loki --> Grafana
    Tempo --> Grafana
```

## 13. Testing Strategy

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

Still evolving:

- deeper end-to-end idempotency coverage
- stronger tenant-isolation coverage across all surfaces
- broader API hardening outside the most critical flows

```mermaid
flowchart TD
    Unit[Unit tests] --> Integration[Integration tests]
    Integration --> E2E[End-to-end tests]
    E2E --> CriticalPaths[Telegram flows, routing, ingestion, retrieval, toggles]
```

## 14. Current Project Status

### Stable enough for demos and serious pilots

- orchestrator-centered asynchronous runtime
- main queue topology
- Telegram integration
- agent graph and core agents
- observability on the critical path
- feature toggles with safe degradation

### Acceptable but still evolving

- Email and WhatsApp maturity
- conversation memory depth
- document lifecycle hardening
- vector persistence strategy at larger scale
- some synchronous API boundaries

### Not yet enterprise-complete

- centralized end-to-end idempotency
- uniformly hardened tenant isolation across every surface
- full enterprise-grade document lifecycle and reconciliation
- larger-scale retrieval and vector operational hardening
