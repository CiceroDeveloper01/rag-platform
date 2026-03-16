# Channel Integrations

[Home](Home) | [Runtime Flow](Runtime-Flow) | [Document Processing](Document-Processing)

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

Email and WhatsApp follow the same overall direction, but remain less mature operationally than Telegram.

Source:

- [docs/CHANNEL_INTEGRATION.md](../CHANNEL_INTEGRATION.md)
- [docs/channels/telegram.md](../channels/telegram.md)
