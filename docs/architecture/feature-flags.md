# Feature Toggles

This document describes the feature toggle strategy that is actually active in the main runtime of the repository.

## Current State

The most explicit toggle layer lives in `apps/orchestrator`, in:

```text
apps/orchestrator/src/config/feature-toggles.config.ts
```

The current model is environment-driven and focused on safe degradation in the runtime.

## Relevant Flags in the Current State

- `TELEGRAM_ENABLED`
- `DOCUMENT_INGESTION_ENABLED`
- `DOCUMENT_PARSING_ENABLED`
- `RAG_RETRIEVAL_ENABLED`
- `CONVERSATION_MEMORY_ENABLED`
- `EVALUATION_ENABLED`
- `OUTBOUND_SENDING_ENABLED`
- `TRAINING_PIPELINE_ENABLED`

There are also channel listener flags in `listeners.config.ts`.

## Safe Degradation Behavior

### Telegram

When the channel is disabled:

- the listener does not start
- polling is not executed

### Document Ingestion

When disabled:

- the pipeline does not execute download, parsing, or indexing
- the runtime records an observable skip

### Document Parsing

When disabled:

- the pipeline uses text fallback instead of full parsing

### Knowledge Retrieval

When disabled:

- retrieval returns empty context
- it does not execute remote search or local fallback

### Conversation Memory

When disabled:

- the service does not call the memory API
- storage returns a local safe fallback
- queries return empty context

### Evaluation

When disabled:

- the runtime continues
- evaluation side effects and related persistence are skipped

### Outbound Sending

When disabled:

- the flow is still processed
- delivery to the channel is skipped
- logs, metrics, and traces record the skip

## Observability

Toggle behavior is visible in the runtime through:

- structured logs
- skip metrics
- traces such as `evaluation_skipped` and `outbound_delivery_skipped`

## Current Limits

The current model is sufficient for:

- simple staged rollout
- incident mitigation
- operational safe mode

What is not yet consolidated:

- tenant-scoped governance
- remote rollout
- advanced centralized flag management
