# Live Activity Stream

This document describes the real-time activity feed used by the dashboard to surface execution events as they happen across the platform.

## Purpose

The live activity stream gives operators immediate visibility into the runtime behavior of the omnichannel pipeline without waiting for a page refresh or a polling cycle.

It is intended to highlight:

- inbound message arrival
- execution start
- knowledge retrieval progress
- agent execution progress
- response dispatch
- execution failures

## Transport

The implementation uses **Server-Sent Events (SSE)**.

SSE was selected because it fits the operational dashboard use case well:

- the flow is server-to-client only
- browser support is simple through `EventSource`
- reconnection is handled automatically by the browser
- the implementation is lighter than full-duplex WebSocket infrastructure

## Backend Flow

The backend keeps the stream inside the existing omnichannel execution tracking layer instead of introducing a parallel module.

High-level flow:

1. The orchestrator creates or updates an execution.
2. `ExecutionService` persists the execution event.
3. `ExecutionService` also publishes a simplified live event to the in-memory stream service.
4. The SSE controller exposes the observable to the dashboard.

Current runtime path:

```text
OmnichannelOrchestratorService
  -> ExecutionService
  -> ExecutionActivityStreamService
  -> GET /api/v1/executions/stream
  -> Dashboard EventSource client
```

## Published Event Shape

Events sent to the frontend include:

```json
{
  "executionId": 42,
  "type": "rag_retrieval_completed",
  "message": "Knowledge retrieval completed (4 documents)",
  "color": "purple",
  "icon": "database",
  "severity": "success",
  "channel": "EMAIL",
  "timestamp": "2026-03-13T14:30:00.000Z",
  "metadata": {
    "contextsCount": 4
  }
}
```

The stream payload is intentionally dashboard-oriented:

- `type`: stable event identifier
- `message`: human-readable text for the feed
- `color`: UI hint for visual classification
- `icon`: lightweight presentation hint for the dashboard
- `severity`: coarse-grained importance level for the event
- `channel`: optional execution channel when available
- `timestamp`: event occurrence time
- `metadata`: optional diagnostic context

## Event Publication

The stream currently publishes events for the main execution milestones:

- `message_received`
- `message_normalized`
- `execution_started`
- `rag_retrieval_started`
- `rag_retrieval_completed`
- `agent_execution_started`
- `agent_execution_completed`
- `response_sent`
- `error`

The `ExecutionService` is responsible for mapping internal execution events into:

- a feed-friendly message
- a presentation color
- a presentation icon
- a severity level
- the final payload broadcast to subscribers

## Frontend Flow

The frontend subscribes through the browser `EventSource` API.

The current flow is:

1. The dashboard mounts the live activity component.
2. The component hook opens an `EventSource` to `/api/v1/executions/stream`.
3. Incoming events are appended to the local list.
4. The UI keeps only the most recent 100 events in memory.
5. Native `EventSource` reconnect behavior is used to recover the stream when possible.

This keeps the feed responsive and bounded without introducing unnecessary client-side complexity.

## Resilience

The stream uses an in-memory replay buffer on the backend and a bounded list on the frontend.

Current safeguards:

- backend replay buffer limited to 100 events
- frontend memory buffer limited to 100 events
- EventSource automatic reconnect behavior
- graceful ignore of malformed SSE payloads
- stream connection and disconnection counters for operational visibility

This design is appropriate for the operational dashboard and local/demo environments. For larger distributed deployments, a shared event bus can be introduced later without changing the dashboard contract.

## UI Behavior

The dashboard shows the feed in chronological activity order with:

- colored event indicator
- human-readable message
- event type badge
- timestamp
- optional metadata block

Color mapping currently used:

- green: `message_received`
- blue: `execution_started`
- purple: knowledge retrieval events
- yellow: agent execution events
- cyan: `response_sent`
- red: `error`

Icon mapping currently used:

- `message-circle`: inbound message received
- `play`: execution started
- `search`: knowledge retrieval started
- `database`: knowledge retrieval completed
- `bot`: agent execution started
- `check-circle`: agent execution completed
- `send`: response sent
- `alert-circle`: execution error

## Metrics

The live stream extends the existing Prometheus instrumentation with stream-specific metrics:

- `live_activity_events_total{type}`
- `live_activity_stream_connections_total`
- `live_activity_stream_disconnects_total`
- `live_activity_stream_subscribers`

These metrics are emitted through the existing backend observability layer rather than a separate monitoring path.

## Notes

- The live stream is an operational visualization layer, not a source of record.
- Persistent execution history remains stored in the execution tracking tables.
- The dashboard feed complements the request detail timeline rather than replacing it.
