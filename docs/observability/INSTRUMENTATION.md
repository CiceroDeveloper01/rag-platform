# Instrumentation

This document explains the standardized observability instrumentation strategy used in the NestJS backend.

## Purpose

The goal is to keep tracing, metrics, and request logging consistent without scattering manual observability code across every service.

The platform now follows three instrumentation layers:

- HTTP requests are instrumented with global interceptors
- important internal methods are instrumented with decorators
- telemetry access is centralized through shared observability services and helpers

## When to use interceptors

Use interceptors for request-boundary concerns:

- request tracing
- HTTP latency metrics
- request lifecycle logging
- correlation and trace propagation

Interceptors are the correct place for cross-cutting transport behavior because they apply consistently to all HTTP traffic.

## When to use `@Trace()`

Use `@Trace()` on important application or infrastructure methods where a named span helps explain the execution path.

Good candidates include:

- omnichannel orchestration
- RAG gateway calls
- agent execution
- inbound channel handlers
- outbound dispatchers
- ingestion workflows
- dashboard query services

Example:

```ts
@Trace('omnichannel.orchestrator.process')
async process(...) {}
```

## When to use `@MetricTimer()`

Use `@MetricTimer()` when a method should emit a reusable duration metric that is not already covered by HTTP-level metrics.

Examples:

```ts
@MetricTimer('rag_query_duration_ms')
async query(...) {}

@MetricTimer({
  metricName: 'omnichannel_orchestrator_duration_ms',
  labels: { module: 'omnichannel' },
})
async process(...) {}
```

## Instrumentation strategy

### HTTP layer

Global interceptors are responsible for:

- starting request spans
- resolving route labels
- recording HTTP metrics
- logging request start and finish
- exposing `x-request-id`, `x-correlation-id`, and `x-trace-id`

### Internal methods

Decorators are used only on methods that add meaningful operational value.

The project does not instrument every method blindly. The focus is on:

- business-critical orchestration steps
- external integrations
- latency-sensitive workflows
- dashboard query paths

### Domain model

Entities and value objects remain free from observability concerns.

Observability belongs at the application and infrastructure layers, not inside domain objects.

## Sensitive data handling

Do not log or trace full sensitive payloads by default.

Important rules:

- do not log tokens, cookies, or authorization headers
- do not serialize large payloads automatically
- do not persist full prompts or model responses in telemetry unless explicitly needed
- prefer IDs, counts, route labels, status, and safe metadata

## What not to instrument

Avoid adding decorators or spans to:

- trivial getters or mappers
- pure domain entities
- very small helper methods with no operational value
- code paths that would generate excessive metric cardinality

## Real examples in the codebase

The current implementation applies the pattern to:

- `OmnichannelOrchestratorService`
- `OmnichannelQueryService`
- `TelegramWebhookService`
- `EmailInboundDevService`
- `TelegramOutboundDispatcher`
- `DevEmailOutboundDispatcher`
- `ExistingRagGatewayAdapter`
- `DefaultAgentExecutor`
- `SearchService`
- `IngestionService`

## Design outcome

This approach keeps the backend:

- easier to instrument consistently
- easier to evolve
- safer from telemetry duplication
- more aligned with observability-first engineering
