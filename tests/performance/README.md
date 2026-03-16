# Performance Tests

This directory contains the initial `k6` load testing structure for local and pre-production validation.

## Structure

- `smoke/`: fast availability checks
- `load/`: average-load scenarios
- `stress/`: ramped stress scenarios
- `lib/`: shared helpers and defaults

## Current scripts

- `smoke/health.js`: validates `/api/v1/health`
- `load/analytics-languages.js`: validates `/api/v1/analytics/languages`
- `load/chat-authenticated.js`: exercises `/api/v1/chat` with a session cookie
- `stress/internal-documents-register.js`: stresses `/api/v1/internal/documents/register`

## Usage

Install `k6` locally, then run for example:

```bash
k6 run tests/performance/smoke/health.js
k6 run tests/performance/load/analytics-languages.js
CHAT_SESSION_COOKIE="rag_platform_session=..." k6 run tests/performance/load/chat-authenticated.js
k6 run tests/performance/stress/internal-documents-register.js
```

## Environment

- `BASE_URL` defaults to `http://localhost:3000`
- `CHAT_SESSION_COOKIE` is required for the authenticated chat scenario

## Default thresholds

- `http_req_failed < 5%`
- `http_req_duration p95 < 1200ms` for smoke
- relaxed per-scenario thresholds where the route is heavier

## Prometheus and Grafana

The local Docker stack already includes Prometheus and Grafana, so `k6` can be
run with Prometheus remote write instead of a separate observability path.

Prerequisites:

```bash
docker compose --env-file ./infra/docker/.env.docker up -d --build prometheus grafana api
```

Example:

```bash
k6 run -o experimental-prometheus-rw=http://localhost:9090/api/v1/write tests/performance/smoke/health.js
```

After that, use Grafana with the existing Prometheus datasource to inspect
metrics such as:

- `k6_http_reqs`
- `k6_http_req_failed`
- `k6_http_req_duration`

This keeps performance telemetry inside the same Prometheus/Grafana stack that
already powers the platform dashboards.
