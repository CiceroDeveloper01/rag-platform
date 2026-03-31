# Domain Boundaries and Messaging Topology

This document records the first logical separation between Banking Core and AI Platform Capabilities, plus the initial RabbitMQ topology map prepared for future domain-oriented asynchronous flows.

This separation is logical for now. The project still preserves the current physical application layout.

## Logical Separation in `api-business`

### Banking Core

Owned inside `apps/api-business/src/modules/banking`:

- `customer`
- `cards`
- `investments`
- `credit`

These modules represent business capabilities that the banking account manager can query or execute through tools.

### AI Platform Capabilities

Still owned inside `apps/api-business/src/modules`:

- `chat`
- `search`
- `documents`
- `ingestion`
- `memory`
- `conversations`
- internal support endpoints used by the orchestrator

These modules represent reusable AI and platform capabilities, not banking-specific business domains.

`Omnichannel` remains part of the broader platform capability layer in the repository, but in practice its most explicit module surface today lives outside `api-business`.

## Why the Separation Is Logical First

The repository now has enough banking behavior to make the distinction valuable, but not enough maturity to justify a disruptive physical split.

So the current decision is:

- make the boundaries explicit
- keep imports and application layout stable
- centralize naming and topology
- postpone deeper physical separation until more banking capability is implemented

## Boundary Registry

The current logical registry lives in:

- `apps/api-business/src/modules/architecture/domain-boundaries.ts`
- `apps/api-business/src/modules/architecture/platform-capabilities.ts`

Those files make the current classification explicit without introducing a heavy abstraction layer.

## RabbitMQ Naming Conventions

Current conventions:

- exchanges are grouped by runtime domain or business subdomain
- routing keys describe the requested action or event state
- queues are named for the consumer workload

Pattern summary:

- exchange: `<domain>` or `<domain>.<subdomain>`
- routing key: `<action>.<state>`
- queue: `<exchange>.<action>-<state>`

Example:

- exchange: `banking.cards`
- routing key: `block.requested`
- queue: `banking.cards.block-requested`

## Initial Topology Map

### Orchestrator

- exchange `orchestrator`
  - queue `orchestrator.inbound-message`
  - routing key `inbound-message.requested`
  - queue `orchestrator.supervisor-decision`
  - routing key `supervisor-decision.requested`
  - queue `orchestrator.specialist-execution`
  - routing key `specialist-execution.requested`
  - queue `orchestrator.reply-dispatch`
  - routing key `reply-dispatch.requested`

### Handoff

- exchange `handoff`
  - queue `handoff.requested`
  - routing key `requested`
  - queue `handoff.processing`
  - routing key `processing`
  - queue `handoff.completed`
  - routing key `completed`

### Ingestion

- exchange `ingestion`
  - queue `ingestion.document-requested`
  - routing key `document.requested`
  - queue `ingestion.document-parsing`
  - routing key `document.parsing`
  - queue `ingestion.document-chunking`
  - routing key `document.chunking`
  - queue `ingestion.document-embedding`
  - routing key `document.embedding`
  - queue `ingestion.document-indexing`
  - routing key `document.indexing`
  - queue `ingestion.document-failed`
  - routing key `document.failed`

### Memory

- exchange `memory`
  - queue `memory.store-requested`
  - routing key `store.requested`
  - queue `memory.context-query`
  - routing key `context.query`
  - queue `memory.enrichment`
  - routing key `enrichment.requested`

### Banking

- exchange `banking.cards`
  - queue `banking.cards.block-requested`
  - routing key `block.requested`
  - queue `banking.cards.unblock-requested`
  - routing key `unblock.requested`
- exchange `banking.investments`
  - queue `banking.investments.simulation-requested`
  - routing key `simulation.requested`
  - queue `banking.investments.order-requested`
  - routing key `order.requested`
- exchange `banking.credit`
  - queue `banking.credit.simulation-requested`
  - routing key `simulation.requested`
  - queue `banking.credit.proposal-requested`
  - routing key `proposal.requested`

## Active Compatibility Note

The current document ingestion runtime still uses the existing binding:

- exchange `documents.ingestion`
- queue `document.ingestion.requested`
- routing key `document.ingestion.requested`

This is preserved on purpose so the current `api-business` publisher and `orchestrator` consumer keep working without migration work in this round.

The new canonical topology is now declared centrally and can be adopted incrementally in future consumers and publishers.

## Shared RabbitMQ Contract Base

The project now has a small shared RabbitMQ base implemented in `@rag-platform/contracts`:

- topology assertion helper for exchange, queue, retry queue, and DLQ declaration
- standard message envelope with correlation and tenant context
- standard AMQP publish-properties builder

This shared base is already used by the active document ingestion publisher and consumer.

The intent is pragmatic:

- reuse the same envelope and conventions when the next real async workflow appears
- avoid inventing queue-specific contracts from scratch
- avoid activating new queues before a real cross-service workflow exists
