# ADR-002 — Omnichannel Architecture

## Status

Accepted

## Context

The platform needs to receive and answer messages through multiple communication channels such as Telegram, Email, Slack, Teams, WhatsApp, SMS, and future transports. Each channel has its own inbound payload format, identity model, transport requirements, and outbound delivery mechanism.

If channel-specific logic were embedded directly into the core orchestration flow, the platform would become harder to evolve, harder to test, and more expensive to extend. The project therefore required an architecture that could isolate transport concerns while preserving a channel-agnostic core.

The decision needed to address:

- normalization of heterogeneous inbound payloads
- orchestration independent from channel transport details
- extensibility for future connectors
- channel-specific outbound dispatch without contaminating business logic
- consistent persistence, telemetry, and RAG integration across channels

## Decision

Adopt an omnichannel architecture based on:

- **Channel Adapters**
- **Message Normalizers**
- **Omnichannel Orchestrator**
- **Outbound Dispatchers**

Inbound messages are translated into a shared internal contract before entering the orchestration layer. The orchestrator remains the central command component responsible for persistence, telemetry, execution policy, optional RAG invocation, and outbound response construction.

Outbound transport concerns are delegated to dispatchers, allowing each channel to evolve independently without forcing channel-specific behavior into the application core.

## Consequences

### Positive

- Makes it easier to add new connectors without redesigning the orchestration core.
- Preserves a channel-agnostic execution model.
- Keeps controller and transport code thin and focused on translation.
- Improves testability by isolating adapters, normalizers, registries, and dispatchers behind explicit contracts.
- Supports observability and analytics consistently across all channels.

### Trade-offs

- Introduces more abstractions than a direct webhook-to-service implementation.
- Requires careful governance of shared contracts to avoid leaking transport-specific details into the core.
- Adds coordination overhead between adapters, normalizers, orchestrator, and dispatchers.
- Some channel features may still require future extension points beyond the MVP abstraction.
