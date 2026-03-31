# RabbitMQ-Focused Topology Review

This document proposes a RabbitMQ design based on the real repository as it exists today.

It is intentionally pragmatic:

- no generic event-driven theory
- no queue sprawl for aesthetics
- no duplication of BullMQ and RabbitMQ just because both exist

The goal is to answer one practical question:

What should RabbitMQ actually do in this project?

## Current Implementation Status

The repository now has a minimal shared RabbitMQ base implemented around the active ingestion flow:

- shared topology assertion helper in `@rag-platform/contracts`
- shared message envelope contract with:
  - `messageId`
  - `correlationId`
  - `causationId`
  - `tenantId`
  - `timestamp`
  - `eventType`
  - `source`
  - `payload`
  - `metadata`
- shared helper to build AMQP publish properties and standard headers
- active `document ingestion` publishing the standard envelope
- active `document ingestion` consumer accepting both:
  - the new envelope
  - the legacy raw ingestion payload
- future event contracts already declared for:
  - `handoff.requested`
  - `memory.enrichment`
  - `banking.investments.order-requested`
  - `banking.credit.proposal-requested`

This is intentionally a base layer, not a migration of new business workflows into RabbitMQ.

## 1. Diagnóstico do Uso Atual

### Onde RabbitMQ já existe hoje

RabbitMQ is real and active today only in the document ingestion path.

Current implemented flow:

- producer: `apps/api-business`
  - `DocumentIngestionPublisherService`
- consumer: `apps/orchestrator`
  - `DocumentIngestionConsumerService`
  - `DocumentIngestionWorkerService`

Current active topology:

- exchange: `documents.ingestion`
- queue: `document.ingestion.requested`
- retry exchange and queue
- dead-letter exchange and queue

This is a good use of RabbitMQ because document ingestion is:

- heavier than a normal chat turn
- cross-service
- retryable
- observable as a background workload

The active flow now propagates `messageId`, `correlationId`, `tenantId`, `eventType`, and `source` in both the envelope body and AMQP headers.

### O que está só declarado, mas ainda não está sendo usado

The repository already declares canonical RabbitMQ topology for:

- `orchestrator`
- `handoff`
- `ingestion`
- `memory`
- `banking`

But most of that topology is not operational yet.

Today it is architecture preparation, not active runtime.

### Onde BullMQ está sendo usado hoje

BullMQ is the active internal runtime queue inside `orchestrator`.

Current active queues:

- `inbound-messages`
- `flow-execution`
- internal DLQs for both

Current role:

- receive channel-originated normalized messages
- route them into supervisor and agents
- execute downstream reply, handoff, or document registration actions

This is not just declared. It is the actual runtime backbone of the conversational flow.

### Existe sobreposição ou confusão entre BullMQ e RabbitMQ?

Yes, potentially.

Current practical split is:

- BullMQ = internal orchestrator job pipeline
- RabbitMQ = cross-service asynchronous ingestion

That split is good.

The confusion risk comes from the declared RabbitMQ topology for orchestrator, handoff, banking, and memory. If those queues are activated without a crisp rule, RabbitMQ will start overlapping with BullMQ instead of complementing it.

## Implemented Guardrails Between BullMQ and RabbitMQ

The implementation now reflects this split more explicitly:

- BullMQ remains the runtime backbone for:
  - inbound channel messages
  - supervisor and specialist execution
  - reply dispatch
  - in-process handoff execution
- RabbitMQ remains the shared async boundary for:
  - document ingestion
  - future cross-service durable workflows only

The code deliberately does **not** move synchronous banking tools, specialist execution, or reply dispatch into RabbitMQ.

## 2. Critério Arquitetural Aplicado ao Projeto Atual

### Quando usar BullMQ

Use BullMQ for:

- internal `orchestrator` work scheduling
- short-lived runtime jobs that belong to a single service boundary
- agent-to-processor transitions
- reply dispatch jobs
- handoff execution jobs when the work still belongs to the orchestrator runtime

Applied to this project:

- `inbound-messages` should remain BullMQ
- `flow-execution` should remain BullMQ
- `execute.reply-conversation` should remain BullMQ
- `execute.handoff` should remain BullMQ unless handoff becomes a real external worker domain later

### Quando usar RabbitMQ

Use RabbitMQ for:

- cross-service asynchronous workloads
- domain events that may have more than one consumer later
- heavy background processing with durable retry semantics
- boundaries where producer and consumer should stay decoupled at the service level

Applied to this project:

- document ingestion clearly belongs here
- future banking events may belong here only when they become long-running, auditable, or handled by a dedicated service or worker

### Quando não usar fila nenhuma

Do not use a queue when:

- the interaction must stay request-response
- the user expects immediate feedback
- the work is cheap and deterministic
- introducing async semantics would only add eventual-consistency problems

Applied to this project:

- card info query
- customer profile query
- credit limit query
- investment simulation
- synchronous business reads in general

### Quais fluxos devem continuar síncronos

Should remain synchronous now:

- tool calls from `orchestrator` to `api-business` for deterministic reads
- card information retrieval
- investment simulation
- customer profile and summary
- credit simulation and limit lookup
- most guardrail decisions
- most response composition

### Quais fluxos devem obrigatoriamente ser assíncronos

Should be asynchronous:

- document ingestion
- any future workload that includes parsing, embeddings, indexing, heavy enrichment, or delayed human/operational processing

Potentially asynchronous later:

- formal handoff processing to external systems
- banking order workflows that wait on external approval or settlement
- long-running memory enrichment or summarization pipelines

## Base Ready for the Next Real Queue

The project is now prepared to activate the next RabbitMQ-backed workflow without a large refactor because it already has:

- canonical topology definitions
- legacy-compatible active topology for ingestion
- standard envelope creation
- shared topology assertion
- retry and dead-letter conventions
- correlation and tenant propagation
- minimal publish and consume observability

Still intentionally missing:

- no active producer or consumer for `handoff.requested`
- no active producer or consumer for `memory.enrichment`
- no active banking order or credit proposal worker
- no migration of synchronous request-response flows

## 3. Filas RabbitMQ Reais do Cenário

This section focuses only on queues that make sense in this project.

### A. `documents.ingestion` exchange

#### Queue `document.ingestion.requested`

- producer: `api-business`
- consumer: `orchestrator`
- payload: `DocumentIngestionRequestedEvent`
- objective: start durable asynchronous document ingestion
- obligatory now: yes
- risk of creating too early: none, already justified and already active

#### Queue `document.ingestion.requested.retry`

- producer: `orchestrator` consumer on transient failure
- consumer: `orchestrator`
- payload: same as ingestion event plus retry headers
- objective: bounded retry with delay
- obligatory now: yes
- risk of creating too early: none, already justified

#### Queue `document.ingestion.requested.dlq`

- producer: `orchestrator` consumer after retry exhaustion or invalid payload
- consumer: operators or replay tooling later
- payload: original event plus failure metadata
- objective: retain failed ingestion work safely
- obligatory now: yes
- risk of creating too early: none, already justified

### B. `handoff` exchange

#### Queue `handoff.requested`

- producer: `orchestrator`
- consumer: future handoff worker or external integration service
- payload: normalized handoff request with correlation and tenant context
- objective: decouple handoff from the conversational runtime once handoff becomes a real external workflow
- obligatory now: no
- risk of creating too early: high

Why I would not activate it now:

- current handoff is already implemented inside the orchestrator pipeline
- moving it to RabbitMQ now would duplicate working behavior without operational gain

### C. `banking.cards` exchange

#### Queue `banking.cards.block-requested`

- producer: maybe `orchestrator` later
- consumer: future banking worker or external integration service
- payload: card block request with explicit card id, user context, correlation id, tenant id
- objective: durable execution only if card block becomes asynchronous or externally delegated
- obligatory now: no
- risk of creating too early: high

Why not now:

- current card block is request-response through `api-business`
- the user expects immediate confirmation
- turning this into async now would complicate UX and confirmation semantics

#### Queue `banking.cards.unblock-requested`

- producer: future
- consumer: future
- payload: explicit unblock request
- objective: same logic as above
- obligatory now: no
- risk of creating too early: high

### D. `banking.investments` exchange

#### Queue `banking.investments.order-requested`

- producer: future `orchestrator` or `api-business`
- consumer: future order-processing worker
- payload: investment order request
- objective: asynchronous order lifecycle if investment order becomes real and depends on external processing
- obligatory now: future only
- risk of creating too early: medium to high

This queue makes sense eventually, but not before there is a real order workflow.

#### Queue `banking.investments.simulation-requested`

- producer: theoretically `orchestrator`
- consumer: `api-business` worker
- payload: simulation parameters
- objective: none that is compelling right now
- obligatory now: no
- risk of creating too early: very high

I would not use RabbitMQ for simulation now.

### E. `banking.credit` exchange

#### Queue `banking.credit.proposal-requested`

- producer: future
- consumer: future credit workflow service
- payload: proposal request with customer and product context
- objective: asynchronous lifecycle once proposal creation becomes a real business process
- obligatory now: future only
- risk of creating too early: medium

#### Queue `banking.credit.simulation-requested`

- producer: theoretically `orchestrator`
- consumer: `api-business`
- payload: credit simulation request
- objective: none compelling right now
- obligatory now: no
- risk of creating too early: very high

Credit simulation should stay synchronous until there is a real reason not to.

### F. `memory` exchange

#### Queue `memory.enrichment`

- producer: future `orchestrator`
- consumer: future memory worker
- payload: conversation or event snapshot needing summarization or enrichment
- objective: offload heavy memory enrichment from the live response path
- obligatory now: no
- risk of creating too early: medium

This is the only memory queue I would consider later. I would not queue normal memory store or memory context query right now.

### G. Notificações / auditoria / telemetria

I would not introduce RabbitMQ queues for audit or telemetry now.

Why:

- logs, traces, metrics, and persisted execution data already exist
- creating dedicated audit queues early would multiply complexity without strong business need

## 4. Topologia Recomendada

### Recommended exchanges now

#### Active now

- `documents.ingestion`

#### Prepare but do not operationalize yet

- `handoff`
- `banking.cards`
- `banking.investments`
- `banking.credit`
- `memory`

### Recommended queues now

#### Active now

- `document.ingestion.requested`
- `document.ingestion.requested.retry`
- `document.ingestion.requested.dlq`

#### Future only

- `handoff.requested`
- `banking.investments.order-requested`
- `banking.credit.proposal-requested`
- `memory.enrichment`

### Routing keys

Use routing keys only where they express real event semantics.

Recommended active ingestion keys:

- `document.ingestion.requested`
- `document.ingestion.requested.retry`
- `document.ingestion.requested.dead`

Recommended future convention:

- `<action>.<state>`

Examples:

- `requested`
- `processing`
- `completed`
- `failed`
- `order.requested`
- `proposal.requested`

### Dead-letter queues

Recommended:

- every active RabbitMQ workload should have a DLQ
- only create DLQs for flows that are truly active

Do not create DLQs for every declared future queue now.

### Retry strategy

Recommended:

- delayed retry queue per active workload
- bounded retries
- explicit dead-letter handoff after retry exhaustion

Current ingestion pattern is already correct enough to reuse later:

- retry count in headers
- delayed retry queue
- DLQ after retry exhaustion

### Idempotência

Every RabbitMQ consumer should have:

- `messageId`
- `correlationId`
- domain-level idempotency key when relevant

Applied to this project:

- ingestion already has a natural idempotency anchor in source status and event metadata
- future banking events should use explicit business ids, never only transport ids

### Correlation ID

Mandatory for every RabbitMQ message:

- `correlationId`
- `x-event-id`
- `tenantId`

This project already values correlation strongly, so RabbitMQ adoption should never happen without this.

### Tenant context

Tenant context should ride in:

- payload
- headers when useful

Why:

- consumers must not guess tenant from routing or queue name
- future banking or memory workers must stay tenant-aware

### Observabilidade mínima

For each active RabbitMQ flow, track:

- publish count
- consume count
- retry count
- DLQ count
- processing duration
- correlation id
- tenant id
- success/failure

Current ingestion already follows this model closely enough.
The implemented ingestion flow now already emits publish, consume, retry, and dead-letter telemetry in a reusable pattern.

## 5. O que Eu Não Colocaria em RabbitMQ Agora

### Não colocaria agora

- channel inbound message intake
- supervisor decision
- specialist execution
- reply dispatch
- synchronous tool execution
- card info lookup
- investment simulation
- customer profile/summary lookup
- credit simulation
- normal memory store
- normal memory context query
- telemetry and audit fan-out

### O que deve continuar síncrono

- `orchestrator -> api-business` deterministic tool calls
- card operations that require immediate response and confirmation
- investment simulations
- customer and credit reads
- guardrail decisions

### O que deve continuar no BullMQ

- `inbound-messages`
- `flow-execution`
- internal retry and DLQ semantics for orchestrator jobs
- handoff execution while handoff still belongs to the orchestrator runtime

### O que seria overengineering agora

- RabbitMQ for every specialist stage
- RabbitMQ for every tool call
- RabbitMQ for all banking operations just because banking exists
- RabbitMQ for memory read/write by default
- RabbitMQ for analytics or observability fan-out

## 6. Riscos e Erros Comuns

### Filas demais

Declaring many queues is cheap. Operating them is not.

### Event-driven sem necessidade

If immediate request-response is already correct, RabbitMQ only adds eventual consistency, retries, and harder debugging.

### Duplicação com BullMQ

This is the biggest risk here. If RabbitMQ starts doing `inbound-message`, `supervisor-decision`, or `reply-dispatch`, it will overlap directly with BullMQ.

### Complexidade operacional

Every active RabbitMQ flow adds:

- exchange bindings
- retry logic
- DLQ handling
- replay behavior
- monitoring and alerting

### Rastreamento fim a fim mais difícil

The more event hops you add, the more important correlation and idempotency become. If these are not rigorously enforced, observability degrades fast.

### Inconsistência entre domínio e orquestração

If banking events are pushed to RabbitMQ before the business lifecycle actually requires async processing, the architecture becomes more ceremonial than useful.

## 7. Recomendação Prática de Adoção

### Fase 1

Implement now:

- keep document ingestion on RabbitMQ
- keep internal conversational runtime on BullMQ
- formalize the rule:
  - BullMQ for internal orchestrator jobs
  - RabbitMQ for cross-service durable async workloads
- improve docs and observability around the active ingestion topology

Technical justification:

- this preserves what already works
- this avoids accidental duplication
- this gives the platform a clear async rule without unnecessary queue growth

### Fase 2

Add later:

- `handoff.requested` only if handoff becomes a real asynchronous external workflow
- `memory.enrichment` only if enrichment becomes expensive enough to leave the live response path
- one real business workflow queue such as `banking.investments.order-requested` or `banking.credit.proposal-requested`, but only when the business lifecycle exists

Technical justification:

- these are the first async expansions that can create real architectural value
- they represent durable workflows, not cheap synchronous calls

### Fase 3

Add only when the platform truly grows:

- richer banking domain event flows
- multi-consumer domain events
- separate workers or services per business workflow
- broader RabbitMQ topology adoption beyond ingestion

Technical justification:

- only worth it when there is enough scale, external dependency, or organizational separation to justify the overhead

## Minha recomendação objetiva

- Eu criaria agora somente as filas RabbitMQ que já têm valor comprovado: as de document ingestion.
- Eu deixaria para depois `handoff.requested`, `memory.enrichment`, `banking.investments.order-requested` e `banking.credit.proposal-requested`.
- Eu manteria BullMQ exatamente onde ele já é forte: `inbound-messages`, `flow-execution` e o pipeline conversacional interno do `orchestrator`.
- Eu usaria RabbitMQ de verdade apenas para workloads cross-service, duráveis e pesados, não para o caminho conversacional normal.
- O menor desenho viável sem perder visão de escala é:
  - BullMQ para conversa
  - RabbitMQ para ingestion
  - mais uma ou duas filas futuras só quando houver um workflow assíncrono real para justificar

## Mapa resumido das filas recomendadas

- Exchange `documents.ingestion`
  - Queue `document.ingestion.requested`
  - Queue `document.ingestion.requested.retry`
  - Queue `document.ingestion.requested.dlq`

- Exchange `handoff`
  - Queue `handoff.requested`
  - future only

- Exchange `memory`
  - Queue `memory.enrichment`
  - future only

- Exchange `banking.investments`
  - Queue `banking.investments.order-requested`
  - future only

- Exchange `banking.credit`
  - Queue `banking.credit.proposal-requested`
  - future only
