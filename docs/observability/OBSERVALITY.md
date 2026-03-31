# Observability

This document describes the current observability model of the repository, including the banking runtime added in the orchestrator and the `api-business` integration path.

## Goals

The platform tracks:

- API and channel traffic
- orchestration flow execution
- knowledge retrieval usage
- tool execution
- handoff activity
- integration calls to `api-business`
- error rates and latency

The goal is to make it clear when a response came from knowledge retrieval, when it came from a deterministic tool, and when it required human escalation.

## Current Stack

- Prometheus for metrics
- Grafana for dashboards
- Loki for logs
- Tempo and OpenTelemetry for tracing
- structured application logs in the NestJS services

## Banking Runtime Observability

The banking branch introduced a few important distinctions:

### Knowledge-Assisted Flow

Use this classification when the specialist uses retrieval or model-driven response generation.

Expected telemetry:

- retrieval usage
- AI-related timing and counters
- token and cost telemetry when there is actual LLM usage
- specialist and intent labels

### Tool-Only Flow

Use this classification when the specialist answers with deterministic data from tools and business APIs.

Expected telemetry:

- tool usage
- integration latency and success or failure
- specialist and intent labels
- no artificial `llmContext`
- no token or LLM cost attribution

This distinction is important for the banking scenario because card information, investment simulations, customer profile queries, and credit limit queries should not appear as if they consumed LLM budget when they did not.

## Correlation

Correlation must follow the request across the banking flow:

- inbound message or HTTP request
- orchestrator routing
- specialist execution
- guardrail checks
- tool execution
- `api-business` integration
- handoff when applicable

`correlationId` propagation is part of the integration path so operators can trace a single banking action across services.

## Banking Metrics to Track

The platform should expose or log enough information to answer:

- which intent was detected
- which specialist handled the message
- whether the response used knowledge retrieval, tool-only, or handoff
- which tool executed
- which `api-business` endpoint was called
- how long the end-to-end flow took
- whether the flow failed and where

Useful metric dimensions include:

- `intent`
- `specialist`
- `toolName`
- `endpoint`
- `status`
- `channel`
- `tenant`

## Handoff Observability

Handoff should be visible as a first-class runtime event.

Track:

- handoff requested
- handoff accepted or dispatched
- reason for escalation when available
- originating specialist or flow branch

This prevents handoff from looking like a normal bot reply and keeps operational review honest.

## Integration Observability for `api-business`

When a banking tool calls `api-business`, the system should record:

- `correlationId`
- tool name
- endpoint path
- success or failure
- latency
- normalized error information

Errors must remain explicit. A failed integration should not become a fake success in telemetry.

## Logs

Structured logs should remain the default in backend services.

Recommended banking log fields:

- `correlationId`
- `intent`
- `specialist`
- `toolName`
- `endpoint`
- `handoffRequested`
- `usedRag` as the current compatibility field name for knowledge retrieval usage
- `usedLlm`
- `success`

Sensitive data must remain redacted or masked contextually. Monetary values needed for business responses should remain legible; identifiers such as card numbers and personal documents should not.

## Operational Reading Guide

When diagnosing a banking interaction:

1. identify the `correlationId`
2. confirm the detected intent and selected specialist
3. check whether the flow was `knowledge-assisted`, `tool-only`, or `handoff`
4. inspect any `api-business` calls and their latency
5. confirm whether a guardrail blocked or requested confirmation
6. verify that AI cost and token telemetry only exist when real LLM usage happened

## Related Documents

- [Platform Architecture](../ARCHITECTURE.md)
- [Banking Architecture](../banking-architecture.md)
- [Runtime Flow](../runtime-flow.md)
