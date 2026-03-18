# Observability

RAG Platform follows an **observability-first architecture**.

The platform includes built-in telemetry across:

- the **API layer**
- the **Omnichannel orchestration layer**
- the **RAG pipeline**
- infrastructure components

This enables engineers and operators to monitor system health, understand request behavior, and troubleshoot failures efficiently.

---

# Observability Stack

The platform uses a modern monitoring stack.

| Component               | Purpose                        |
| ----------------------- | ------------------------------ |
| Prometheus              | Metrics collection and storage |
| Grafana                 | Visualization dashboards       |
| Loki                    | Centralized log aggregation    |
| Promtail                | Container log collectors       |
| Tempo                   | Distributed tracing backend    |
| OpenTelemetry Collector | Telemetry pipeline             |

These services are available in the **Docker environment** and can also be deployed in production infrastructure.

For local development the full stack is started with:

```bash
docker compose --env-file ./infra/docker/.env.docker up -d --build
```

Quick access URLs:

- Frontend: `http://localhost:3002`
- API: `http://localhost:3000`
- Grafana: `http://localhost:3005`
- Prometheus: `http://localhost:9090`
- Tempo: `http://localhost:3200`
- Loki: `http://localhost:3100`
- PostgreSQL: `localhost:5433`

Local Grafana credentials:

- user: `admin`
- password: `admin`

---

# Instrumentation Strategy

The backend uses a standardized instrumentation approach to reduce duplicated tracing and metrics code.

The strategy is:

- HTTP requests are instrumented through global interceptors
- important internal application and infrastructure methods use decorators such as `@Trace()` and `@MetricTimer()`
- telemetry access is centralized through shared observability services and helpers instead of direct SDK usage everywhere
- short-lived cache entries can be applied to read-heavy flows without bypassing the instrumentation model

This keeps tracing, metrics, correlation, and request logging consistent while preserving thin controllers and clean domain boundaries.

Related document:

- [Instrumentation Guide](INSTRUMENTATION.md)

## Cache and Observability

The backend applies short-lived cache entries in two strategic areas:

- omnichannel dashboard query endpoints
- RAG retrieval and context assembly

In Docker-based local development, these entries are stored in Redis.

The cache policy is intentionally conservative:

- the final LLM answer is not cached by default
- channel dispatch operations are not cached
- mutating routes are not cached
- dashboard and retrieval caches use short TTLs

This improves repeated read performance while preserving observability:

- HTTP interceptors still emit request metrics
- service-level tracing still wraps critical application methods
- targeted invalidation is triggered after document ingestion and connector state changes where practical

---

# Metrics

Metrics provide visibility into system performance and operational behavior.

Prometheus scrapes metrics exposed by the NestJS API.

It also scrapes the OpenTelemetry Collector, Loki, Promtail, Tempo-related telemetry targets, and Prometheus itself inside the Docker network.

The same Prometheus instance can also receive `k6` performance metrics through
remote write during local load testing, which allows ad hoc performance
inspection in Grafana without introducing a separate metrics backend.

Example metrics endpoint:

http://localhost:3000/metrics

To verify locally:

```bash
curl http://localhost:3000/metrics
```

---

# HTTP Metrics

These metrics track API request behavior.

Metrics include:

- rag_platform_api_http_requests_total
- rag_platform_api_http_errors_total
- rag_platform_api_http_request_duration_seconds

Labels used:

- method
- route
- status_code

These metrics allow monitoring of:

- request throughput
- endpoint latency
- error rate
- per-route behavior

---

# RAG Pipeline Metrics

The platform exposes metrics for key stages of the RAG workflow.

Metrics include:

- rag_platform_api_rag_requests_total
- rag_platform_api_rag_embedding_duration_seconds
- rag_platform_api_rag_vector_search_duration_seconds
- rag_platform_api_rag_llm_duration_seconds
- rag_platform_api_rag_ingestion_total
- rag_platform_api_rag_chunks_generated_total
- rag_platform_api_rag_documents_processed_total

These metrics allow analysis of:

- embedding latency
- vector search performance
- LLM response time
- ingestion pipeline throughput

---

# Omnichannel Metrics

Since the platform supports multiple communication channels, additional metrics capture channel-level behavior.

Examples include:

- requests per channel
- average latency per channel
- RAG usage rate
- dispatch failures
- connector health status
- AI policy accepted traffic
- AI policy rejections
- aggregate AI token usage

These metrics power the operational dashboard.

---

# Authentication and Conversation Metrics

The platform also tracks activity related to user sessions and conversations.

Metrics include:

- rag_platform_api_auth_logins_total
- rag_platform_api_conversations_operations_total

These metrics help monitor:

- authentication activity
- conversation lifecycle operations
- session trends

---

# Logging

The backend uses **structured logging**.

Logging stack:

- nestjs-pino for structured logs
- Loki for centralized log storage
- Promtail for container log collection

Logs are structured as JSON in production environments and formatted for readability in development.

In the Docker stack the API runs with JSON logs so Promtail can ship them to Loki without lossy parsing.

---

# Sensitive Data Protection

Sensitive fields are automatically redacted.

Protected fields include:

- authorization headers
- cookies
- passwords
- tokens
- session identifiers

This prevents sensitive data from appearing in logs.

---

# Correlation and Troubleshooting

To simplify debugging and incident analysis, the system supports request correlation.

Features include:

- x-request-id propagation
- request-scoped logging
- correlation IDs in logs
- execution metadata stored in the database

This enables tracing a request across:

1. inbound channel
2. normalization
3. orchestration
4. RAG pipeline
5. agent execution
6. outbound dispatch

---

# Tracing

Distributed tracing is implemented using:

- OpenTelemetry instrumentation
- Tempo trace visualization

Tracing allows visualization of request execution across internal components.

Typical trace stages include:

1. inbound request
2. message normalization
3. orchestration decision
4. optional RAG retrieval
5. agent execution
6. response dispatch

Tracing helps identify:

- slow RAG operations
- high-latency endpoints
- execution bottlenecks

For local execution the NestJS API exports OTLP traces to:

`http://otel-collector:4318`

The OpenTelemetry Collector then forwards traces to Tempo.

---

# Dashboards

Grafana dashboards provide visibility into platform operations.

Recommended dashboards include:

## API Dashboard

Shows:

- request volume
- latency percentiles
- error rate
- endpoint performance

---

## RAG Dashboard

Shows:

- embedding latency
- vector search latency
- LLM response duration
- ingestion throughput

---

## Omnichannel Dashboard

Shows:

- requests per channel
- response latency by channel
- RAG usage rate
- dispatch failures

---

## Infrastructure Dashboard

Shows:

- container health
- PostgreSQL connection state
- API resource usage

Provisioned dashboards are stored in:

- `infra/observability/grafana/dashboards/rag-platform-api-overview.json`
- `infra/observability/grafana/dashboards/rag-platform-omnichannel-overview.json`
- `infra/observability/grafana/dashboards/rag-platform-logs-overview.json`

---

# Health Monitoring

The platform exposes a health endpoint.

Example:

GET /health

This endpoint verifies:

- database connectivity
- service availability
- internal dependencies

Health checks can be used by:

- container orchestrators
- monitoring systems
- uptime checks

The local Docker stack also defines health checks for:

- postgres
- api
- web
- otel-collector
- prometheus
- grafana
- loki
- promtail
- jaeger

---

# Observability Goals

The observability layer was designed to enable:

- fast incident detection
- performance analysis
- debugging of AI execution flows
- monitoring RAG pipeline behavior
- visibility into omnichannel traffic

---

# Future Improvements

Planned improvements include:

- deeper OpenTelemetry instrumentation
- OTLP trace export
- Grafana Tempo integration
- advanced RAG tracing
- per-agent performance metrics
- Prometheus alert rules

These improvements will enhance operational visibility as the platform evolves.

---

# Local Validation Checklist

After the stack is up, validate:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/metrics
curl http://localhost:9090/targets
curl http://localhost:3005/api/health
docker compose --env-file ./infra/docker/.env.docker logs -f api
```

Expected results:

- API health responds successfully
- `/metrics` exposes Prometheus metrics, including omnichannel metrics
- Prometheus targets page shows `up`
- Grafana loads with provisioned datasources
- Tempo displays traces once API traffic is generated
- Loki receives container logs through Promtail
