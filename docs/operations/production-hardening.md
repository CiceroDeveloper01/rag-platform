# Production Hardening

## Critical gaps reviewed

- API had health endpoints but no explicit `live` and `ready`
- orchestrator had no HTTP probe surface for liveness/readiness
- internal API retries existed, but there was no circuit breaker to stop failure cascades
- inbound queue relied on attempts/backoff but had no explicit dead-letter queue for final failures
- queue deduplication existed only while jobs were retained; retention was too shallow for safer replay protection
- rate limiting already existed in the API through `@nestjs/throttler`
- observability stack already existed with Prometheus, Grafana, Tempo and OTEL

## Risk priority

1. Dependency failure cascade between orchestrator and API
2. Invisible worker degradation without probes
3. Message replay and duplicate processing windows that were too short
4. Final queue failures without explicit DLQ capture
5. Secrets still managed by environment variables only

## Implemented hardening

- API `GET /health/live` and `GET /health/ready`
- orchestrator `GET /health`, `GET /live`, `GET /ready`
- internal API circuit breaker with environment-driven thresholds
- explicit inbound DLQ queue for final worker failures
- stronger queue retention and deterministic job ids for inbound and flow execution
- Docker health check for orchestrator

## Environment variables

- `HTTP_CIRCUIT_BREAKER_ENABLED`
- `HTTP_CIRCUIT_BREAKER_FAILURE_THRESHOLD`
- `HTTP_CIRCUIT_BREAKER_OPEN_MS`
- `INBOUND_QUEUE_DLQ_NAME`
- `FLOW_EXECUTION_QUEUE_DLQ_NAME`
- `INBOUND_QUEUE_COMPLETED_RETENTION_SECONDS`
- `INBOUND_QUEUE_FAILED_RETENTION_SECONDS`
- `FLOW_EXECUTION_QUEUE_COMPLETED_RETENTION_SECONDS`
- `FLOW_EXECUTION_QUEUE_FAILED_RETENTION_SECONDS`

## Secrets management guidance

- keep production secrets out of `docker-compose.yml`
- inject secrets through the runtime environment or secret manager
- never commit provider tokens, SMTP passwords, API keys or bot tokens
- rotate secrets when incidents affect channel credentials or OpenAI/API credentials

## Notes

- the API already enforces global request throttling and targeted throttling on selected omnichannel endpoints
- asynchronous retries remain primarily owned by BullMQ attempts/backoff
- only the active inbound worker now routes final failures to DLQ; flow-execution DLQ naming is prepared for the next worker stage
