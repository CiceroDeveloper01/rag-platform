# Observability

[Home](Home) | [Runtime Flow](Runtime-Flow) | [Testing Strategy](Testing-Strategy)

The repository includes:

- structured logs
- Prometheus-style metrics
- OpenTelemetry tracing
- dedicated agent trace events
- queue-related failure and throughput metrics
- cost and evaluation analytics in the orchestrator path

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

## Stack

- OpenTelemetry
- Prometheus
- Grafana
- Tempo
- Loki

Source:

- [docs/ARCHITECTURE.md](../ARCHITECTURE.md)
- [docs/observability/OBSERVABILITY.md](../observability/OBSERVABILITY.md)
