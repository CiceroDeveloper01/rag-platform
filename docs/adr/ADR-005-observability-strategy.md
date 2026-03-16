# ADR-005 — Observability Strategy

## Status

Accepted

## Context

RAG-PLATAFORM is designed as an operational AI platform rather than a single-purpose API. That means the engineering team needs visibility into request flow, channel behavior, latency, RAG usage, dispatch failures, connector state, and infrastructure health.

Because the system spans authentication, chat, RAG ingestion, omnichannel orchestration, analytics endpoints, and Dockerized local infrastructure, observability needed to be designed as a first-class concern from the beginning.

The platform required a strategy that could support:

- application metrics
- structured logs
- distributed traces
- dashboard-friendly telemetry
- local development and demo observability

## Decision

Adopt an observability stack composed of:

- **Prometheus**
- **Grafana**
- **Loki**
- **Jaeger**
- **OpenTelemetry**

Prometheus is used for metrics collection, Grafana for visualization, Loki for centralized logs, Jaeger for trace visualization, and OpenTelemetry for telemetry instrumentation and pipeline integration.

The platform emits telemetry across HTTP requests, RAG stages, omnichannel orchestration, dashboard query endpoints, and infrastructure components.

## Consequences

### Positive

- Enables full operational visibility across metrics, logs, and traces.
- Supports debugging of end-to-end channel-to-response flows.
- Makes latency, failure, and usage analysis available to both engineers and operators.
- Integrates well with the Docker-based local development environment and demo workflows.
- Reinforces observability-first engineering as a platform principle instead of a late add-on.

### Trade-offs

- Increases local infrastructure complexity compared with a minimal app stack.
- Requires governance of telemetry naming, cardinality, and dashboard maintenance.
- Adds configuration surface for containers, datasources, and collectors.
- The project accepts this overhead because observability is central to the product's operational value.
