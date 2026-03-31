# Observability Flow

This diagram shows how telemetry flows through the **Intelligent Automation Platform observability stack**.

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
    APIWEB[NestJS api-web]
    APIBUS[NestJS api-business]
    ORCH[NestJS orchestrator]

    Knowledge[Knowledge Retrieval Capability]
    AGENT[Decision Runtime / Agent Executor]

    DB[(PostgreSQL + pgvector)]

    OTEL[OpenTelemetry Instrumentation]
    COLLECTOR[OTEL Collector]

    PROM[Prometheus]
    LOKI[Loki]
    TEMPO[Tempo]

    GRAFANA[Grafana Dashboards]

    USER --> WEB
    WEB --> APIWEB
    APIWEB --> APIBUS

    APIBUS --> Knowledge
    Knowledge --> AGENT
    AGENT --> DB
    ORCH --> DB

    APIWEB -. metrics .-> OTEL
    APIBUS -. metrics .-> OTEL
    ORCH -. metrics .-> OTEL
    Knowledge -. metrics .-> OTEL
    AGENT -. metrics .-> OTEL

    APIWEB -. logs .-> OTEL
    APIBUS -. logs .-> OTEL
    ORCH -. logs .-> OTEL
    Knowledge -. logs .-> OTEL
    AGENT -. logs .-> OTEL

    APIWEB -. traces .-> OTEL
    APIBUS -. traces .-> OTEL
    ORCH -. traces .-> OTEL
    Knowledge -. traces .-> OTEL
    AGENT -. traces .-> OTEL

    OTEL --> COLLECTOR

    COLLECTOR --> PROM
    COLLECTOR --> LOKI
    COLLECTOR --> TEMPO

    PROM --> GRAFANA
    LOKI --> GRAFANA
    TEMPO --> GRAFANA
```

---

# Telemetry Types

The platform emits three main types of telemetry signals.

## Metrics

Metrics track numerical measurements over time.

Examples:

- request count
- request latency
- knowledge retrieval execution duration
- vector search time
- LLM response latency

Metrics are collected by **Prometheus** and visualized in **Grafana**.

---

## Logs

Logs capture structured runtime events.

Examples include:

- inbound message logs
- knowledge retrieval logs
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
4. optional knowledge retrieval
5. agent execution
6. response dispatch

Traces are collected through:

- OpenTelemetry instrumentation
- Tempo tracing backend

---

# Grafana Dashboards

Grafana provides a unified view of the system.

Typical dashboards include:

### API Metrics

- request throughput
- error rate
- latency percentiles

### Knowledge Retrieval Performance

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
- understand knowledge retrieval behavior
