# Observability Flow

This diagram shows how telemetry flows through the **RAG-PLATAFORM observability stack**.

The platform follows an **observability-first architecture**, capturing:

- metrics
- logs
- distributed traces

These signals allow operators to monitor system health and diagnose failures.

---

```mermaid
flowchart TD

    USER[User Request]
    WEB[Next.js Web]
    API[NestJS API]

    RAG[RAG Pipeline]
    AGENT[Agent Executor]

    DB[(PostgreSQL + pgvector)]

    OTEL[OpenTelemetry Instrumentation]
    COLLECTOR[OTEL Collector]

    PROM[Prometheus]
    LOKI[Loki]
    JAEGER[Jaeger]

    GRAFANA[Grafana Dashboards]

    USER --> WEB
    WEB --> API

    API --> RAG
    RAG --> AGENT
    AGENT --> DB

    API -. metrics .-> OTEL
    RAG -. metrics .-> OTEL
    AGENT -. metrics .-> OTEL

    API -. logs .-> OTEL
    RAG -. logs .-> OTEL
    AGENT -. logs .-> OTEL

    API -. traces .-> OTEL
    RAG -. traces .-> OTEL
    AGENT -. traces .-> OTEL

    OTEL --> COLLECTOR

    COLLECTOR --> PROM
    COLLECTOR --> LOKI
    COLLECTOR --> JAEGER

    PROM --> GRAFANA
    LOKI --> GRAFANA
    JAEGER --> GRAFANA
```

---

# Telemetry Types

The platform emits three main types of telemetry signals.

## Metrics

Metrics track numerical measurements over time.

Examples:

- request count
- request latency
- RAG execution duration
- vector search time
- LLM response latency

Metrics are collected by **Prometheus** and visualized in **Grafana**.

---

## Logs

Logs capture structured runtime events.

Examples include:

- inbound message logs
- RAG retrieval logs
- agent execution logs
- dispatch failures

Logs are aggregated using:

- **Promtail**
- **Loki**

---

## Distributed Traces

Tracing shows the lifecycle of a request across services.

Example trace flow:

1. request received
2. normalization
3. orchestration
4. optional RAG retrieval
5. agent execution
6. response dispatch

Traces are collected through:

- OpenTelemetry instrumentation
- Jaeger tracing backend

---

# Grafana Dashboards

Grafana provides a unified view of the system.

Typical dashboards include:

### API Metrics

- request throughput
- error rate
- latency percentiles

### RAG Performance

- embedding duration
- vector search latency
- LLM response time

### Omnichannel Activity

- requests per channel
- response latency
- connector health

### Infrastructure

- container health
- database connections
- resource usage

---

# Observability Benefits

This architecture allows engineers to:

- detect failures quickly
- analyze AI pipeline performance
- monitor channel activity
- debug distributed workflows
- understand RAG execution behavior
