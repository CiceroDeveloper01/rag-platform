# Incident Runbook

## 1. API unhealthy

- check `GET /api/v1/health/ready`
- inspect database, redis, storage and RAG component statuses
- inspect `docker compose logs -f api`
- if the failure is dependency-related, restore the dependency first

## 2. Orchestrator unhealthy

- check `GET /ready` on port `3001`
- inspect `docker compose logs -f orchestrator`
- verify Redis availability and API readiness
- if internal API circuit is open, stabilize the API before forcing orchestrator restarts

## 3. Rising queue failures

- inspect logs for `Inbound job failed`
- inspect DLQ queue `inbound-messages-dlq`
- identify whether failures are validation, dependency or payload related
- replay only after the root cause is resolved

## 4. Duplicate message suspicion

- confirm whether the message reused the same `externalMessageId`
- inspect retained BullMQ jobs for the same job id
- inspect channel source retries and webhook/provider behavior

## 5. Channel outage

- inspect provider credentials and timeout/retry configuration
- verify outbound adapter base URL and token configuration
- verify Grafana and Prometheus for channel retry/failure spikes

## 6. Recovery checklist

- dependency restored
- readiness healthy
- error rate returning to baseline
- DLQ drained or replay plan defined
- incident notes recorded with timestamps, impact and corrective action
