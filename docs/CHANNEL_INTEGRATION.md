# Channel Integration

This document summarizes how channels integrate with the platform runtime.

## Core Principle

Channels are treated as the transport layer.

They should:

- receive external events
- normalize payloads
- publish canonical messages to the inbound queue
- deliver outbound responses

They should not:

- choose the target agent
- perform document ingestion
- execute retrieval logic
- own runtime business rules

## Channel Integration Model

```mermaid
flowchart LR
    Provider[External provider] --> Adapter[Inbound adapter]
    Adapter --> Listener[Channel listener]
    Listener --> InboundQ[inbound-messages]
    InboundQ --> Orchestrator[Orchestrator runtime]
    Orchestrator --> FlowQ[flow-execution]
    FlowQ --> Outbound[Outbound service]
    Outbound --> Provider
```

## Telegram

Telegram is the most mature channel in the repository.

Main runtime components:

- `TelegramInboundAdapter`
- `TelegramPollingService`
- `TelegramListener`
- `TelegramOutboundService`

```mermaid
sequenceDiagram
    participant Telegram as Telegram API
    participant Polling as TelegramPollingService
    participant Adapter as TelegramInboundAdapter
    participant Listener as TelegramListener
    participant InboundQ as inbound-messages
    participant Runtime as Orchestrator runtime
    participant Flow as FlowExecutionProcessor
    participant Outbound as TelegramOutboundService

    Telegram->>Polling: updates
    Polling->>Adapter: provider payload
    Adapter->>Listener: canonical inbound message
    Listener->>InboundQ: enqueue job
    InboundQ->>Runtime: process inbound job
    Runtime->>Flow: enqueue downstream execution
    Flow->>Outbound: send response
    Outbound->>Telegram: Bot API request
```

## Email

Email has adapter, listener, and outbound components in the runtime shape, but it is still less mature operationally than Telegram.

## WhatsApp

WhatsApp also has adapter and listener components, but it remains less mature than Telegram in current operational terms.

## Channel Maturity Reading

- Telegram: most stable
- Email: acceptable but still evolving
- WhatsApp: still evolving

## Guidance for Future Channels

```mermaid
flowchart TD
    NewChannel[New channel] --> Canonical[Produce canonical payload]
    Canonical --> Queue[inbound-messages]
    Queue --> Runtime[Orchestrator runtime]
    Runtime --> Outbound[Dedicated outbound service]
```

Any new channel should preserve:

- canonical payload mapping
- no business logic in adapters
- orchestrator-centered execution
- dedicated outbound delivery logic
