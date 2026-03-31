# Current State Diagnosis

This document is a critical review of the repository as it exists today, considering:

- `apps/orchestrator`
- `apps/api-business`
- `apps/api-web`
- `apps/web`
- banking integrations
- tools and guardrails
- handoff and observability
- BullMQ and RabbitMQ
- current documentation and diagrams

It is intentionally direct. The goal is to make the next architectural steps clearer, not to soften the current gaps.

## Diagnóstico Atual

The repository is no longer just a retrieval-oriented platform. It is now a mixed architecture composed of:

- a banking-oriented conversational runtime in `orchestrator`
- a synchronous business API in `api-business`
- a web-facing BFF in `api-web`
- a Next.js interface in `web`
- a still-present legacy omnichannel orchestration surface in `api-web`

The strongest delivered part of the project today is the banking runtime:

- `SupervisorAgent` routes banking traffic into `account-manager-agent`
- `account-manager.orchestrator` classifies intent and selects specialists
- specialists decide between `RAG`, `tool-only`, or hybrid behavior
- guardrails block sensitive actions until confirmation exists
- handoff reuses the real handoff pipeline
- banking tools call real endpoints in `api-business`

The weakest architectural point is that the repository still carries two orchestration narratives at the same time:

- the new runtime centered in `orchestrator`
- the older omnichannel orchestration implemented in `api-web`

That does not make the system broken, but it does mean the platform is not yet fully consolidated around a single runtime ownership model.

## 1. Estado Atual Consolidado

### Applications and Responsibilities

#### `apps/orchestrator`

Current role:

- conversational runtime
- channel intake and normalization path
- BullMQ workers
- supervisor and agent graph
- banking account manager flow
- decision layer
- specialists
- guardrails
- tools
- handoff coordination
- document ingestion consumer and worker

This is the real brain of the new banking architecture.

#### `apps/api-business`

Current role:

- synchronous domain and business API
- chat, search, documents, ingestion, conversations, memory
- internal synchronous support endpoints for the orchestrator
- banking domain with:
  - `customer`
  - `cards`
  - `investments`
  - `credit`

Important nuance:

- the banking subdomain is correctly implemented as business API
- the application as a whole is still not decoupled from LLM and chat concerns

#### `apps/api-web`

Current role:

- portal-facing BFF
- auth, analytics, health, traces, search, simulation
- omnichannel dashboard and related endpoints
- legacy omnichannel orchestration flow

This app is correct as a BFF in principle, but it still contains orchestration behavior that competes with the `orchestrator` narrative.

#### `apps/web`

Current role:

- UI and operator screens
- chat and document interaction surfaces
- dashboard and observability views

This boundary is the cleanest one in the repository.

### Runtime Components

#### Banking Runtime in `orchestrator`

Implemented components:

- `SupervisorAgent`
- `AccountManagerAgent`
- `AccountManagerOrchestrator`
- `DecisionService`
- banking specialists
- `ResponseComposerService`
- `BankingConversationStateService`
- `BankingGuardrailService`
- `GuardrailService`
- banking tools
- `ApiBusinessBankingClient`

#### Banking Runtime in `api-business`

Implemented components:

- banking controllers
- banking services
- DTOs and interfaces
- app-level module aggregation

Current implementation detail:

- services are mock-backed and deterministic
- contracts are real HTTP contracts

### Queue and Messaging Components

#### BullMQ

Active internal orchestrator queues:

- `inbound-messages`
- `flow-execution`
- dead-letter queues for those workloads

Current role:

- internal orchestrator job pipeline
- channel event intake
- downstream execution dispatch

#### RabbitMQ

Active today:

- document ingestion flow
  - `documents.ingestion`
  - `document.ingestion.requested`
  - retry and dead-letter variants

Declared centrally, but mostly not yet active:

- orchestrator queues
- handoff queues
- ingestion stage queues
- memory queues
- banking queues

This means RabbitMQ is currently real for ingestion and architectural preparation for other domains.

### End-to-End Flow

#### Banking conversational flow

Current implemented path:

`channel or chat -> orchestrator -> supervisor -> account-manager-agent -> decision layer -> specialist -> guardrail -> tool or RAG -> api-business when tool is used -> response composer -> flow execution -> outbound response`

What actually happens:

1. message enters the orchestrator path
2. `SupervisorAgent` decides whether the banking branch should handle it
3. `AccountManagerAgent` invokes `AccountManagerOrchestrator`
4. the decision layer classifies intent
5. the selected specialist decides whether to:
   - use `RAG`
   - use a tool
   - request handoff
6. if the action is sensitive, guardrails require confirmation
7. when tools are used, the tool calls `ApiBusinessBankingClient`
8. the client calls `api-business`
9. the specialist returns a structured result
10. the response is composed and dispatched

#### Document ingestion flow

Current implemented path:

`web or internal request -> api-business -> RabbitMQ -> orchestrator worker -> parsing/chunking/embedding/indexing -> internal callback/update`

This is the clearest current use of RabbitMQ as a real cross-service async boundary.

## 2. O que Já Está Sólido

### Strong Architectural Decisions

- keeping business execution out of `RAG`
- using tools as deterministic business adapters
- putting decision logic in specialists and orchestration instead of in tools
- reusing a real handoff pipeline instead of simulating escalation
- preserving multi-turn confirmation state for sensitive operations
- placing the banking domain behind `api-business`

These should be kept.

### Strong Implementation Areas

- banking routing in `orchestrator`
- cards and investments specialist flows
- real tool integration to `api-business`
- correct observability split between `RAG` and `tool-only`
- logical boundary registry for Banking Core vs AI Platform Capabilities
- centralized messaging topology declaration

### Near Production-Ready Areas

Closest to production quality:

- overall `orchestrator -> tool -> api-business` interaction model
- multi-turn confirmation handling
- handoff reuse
- deterministic tool-only observability
- document ingestion async pattern using RabbitMQ

What is close to production-ready is the architecture pattern, not the banking data implementation itself.

## 3. O que Está Incompleto ou Parcial

### Banking Services

The banking services in `api-business` are still mock-backed.

Consequence:

- good contracts
- weak business depth
- limited trust as a true banking core

### Specialist Coverage

Most mature flows:

- cards
- investments

Partial or less mature:

- customer
- credit
- debt

### Messaging Adoption

The RabbitMQ topology is prepared, but only ingestion is actually operational.

Consequence:

- the topology is useful as design preparation
- it is not yet proof of broader async scale

### Tenant Handling

Tenant propagation exists in integrations and headers, but current banking services do not meaningfully implement tenant-aware business behavior.

### Documentation Surfaces

Canonical docs improved a lot. Secondary docs still lag.

## 4. O que Ainda Está Faltando

### Business Capability

- persistent banking repositories
- external banking integrations
- debt and negotiation flows backed by real APIs
- explicit entity resolution for cards and products
- stronger customer and credit domain behavior

### Platform Capability

- a fully unified runtime ownership model
- a stronger contract governance model between `orchestrator` and `api-business`
- a more consistent async event strategy
- broader platform-level hardening for failures, retries, and operational recovery

### Messaging

- actual use of the newly declared RabbitMQ topology for selected domain events
- operational rules for when RabbitMQ should be preferred over BullMQ
- clearer consumer boundaries by workload

## 5. Pontos de Atenção Arquitetural

### Orchestrator vs `api-business` vs `api-web`

#### `orchestrator`

Assessment: mostly correct.

- it centralizes the new banking decision flow correctly
- it owns specialists, tools, guardrails, and handoff coordination

#### `api-business`

Assessment: correct for banking core, not fully clean as an application boundary.

- it is correct as the place for banking APIs
- it is not yet cleanly decoupled from LLM and chat concerns
- it still hosts chat and AI-facing platform capabilities

#### `api-web`

Assessment: directionally correct as BFF, but still architecturally overloaded by legacy omnichannel orchestration.

If the target architecture says the `orchestrator` is the runtime brain, then `api-web` should not continue to look like a second orchestrator over time.

### Chat, Channels, and Domain Separation

The intended separation is good:

- channels and chat should be transport and interaction surfaces
- business decisions should happen in `orchestrator`
- business execution should happen through `api-business`

Current reality:

- the new banking branch follows this rule reasonably well
- legacy omnichannel logic in `api-web` still weakens that separation

### Tools vs Business Rules

Assessment: mostly correct.

- tools are thin
- tools do not decide business strategy
- specialists decide when to use tools

This is one of the healthiest parts of the current implementation.

### BullMQ vs RabbitMQ

Assessment: partially clear, not fully institutionalized.

Current practical reality:

- BullMQ = active internal orchestrator pipeline
- RabbitMQ = active cross-service ingestion pipeline

Current problem:

- this rule is visible in practice, but not yet fully enforced as platform doctrine
- additional RabbitMQ topology exists mainly on paper today

## 6. Validações Obrigatórias

### Is `api-business` really decoupled from LLM and chat?

No.

It is not decoupled at the application level.

Why:

- `api-business` still contains `ChatService`
- it still contains AI and embedding configuration
- it still owns search, memory, and RAG-related synchronous behavior

More precise statement:

- the `banking` subdomain is correctly decoupled from LLM-driven execution
- `api-business` as an application is still a mixed boundary containing both Banking Core and AI Platform Capabilities

### Is the `orchestrator` centralizing decision correctly?

Mostly yes, but not universally.

Yes for:

- the current banking runtime
- specialists, guardrails, handoff, and tools

Not fully yes for the repository as a whole because:

- `api-web` still contains `OmnichannelOrchestratorService`
- part of the older orchestration story still lives outside `orchestrator`

### Does RabbitMQ make sense for scale?

Yes for the kind of workloads it is currently used for.

It makes sense for:

- cross-service async ingestion
- future domain events that deserve durable async processing

But today it is mostly real only for ingestion. The broader topology is declared, not yet exercised.

### Do BullMQ and RabbitMQ have clear roles?

Partially.

The code suggests this split:

- BullMQ for internal orchestrator runtime jobs
- RabbitMQ for cross-service/domain async flows

That is a good split. It is not yet fully consolidated across all docs, runtime decisions, and future queue adoption.

### Is the architecture avoiding a coupled monolith?

Partially yes.

It is clearly better than a monolith because:

- there are distinct apps
- the banking runtime is separated from business APIs
- cross-service boundaries exist

But there is still monolith risk inside `api-business` because it currently aggregates:

- banking core
- chat
- search
- memory
- ingestion
- AI-facing capabilities

If this continues to grow without stronger modular discipline, `api-business` can become a large mixed-core service.

## 7. Riscos Técnicos

### Runtime Duplication Risk

The existence of orchestration logic in both `orchestrator` and `api-web` creates long-term confusion around runtime ownership.

### Broad `api-business` Risk

`api-business` is currently both:

- a business API
- a host for AI platform capabilities

That is acceptable for now, but it is the main place where future coupling can accumulate.

### Contract Coupling Risk

Tools depend directly on current `api-business` response contracts. If DTOs change frequently, orchestrator churn will follow.

### Entity Resolution Risk

Default card fallback is still risky as sensitive actions grow.

### Async Complexity Risk

Two queue technologies are already in play. If their roles blur, operations and troubleshooting will become harder quickly.

### Tenant Hardening Risk

Tenant context exists in plumbing but not strongly in behavior. That gap will hurt later if not closed before real persistence lands.

## 8. Inconsistências

### Between Code and Documentation

Still behind:

- `docs/api/API.md`
- `docs/api/api-endpoints.md`
- `docs/api/SWAGGER.md`
- parts of `docs/wiki/*`
- `docs/omnichannel/omnichannel.md`

Main drift:

- secondary docs still under-document the banking runtime
- some docs still over-emphasize the older omnichannel and generic retrieval story

### Between Code and Diagrams

Main inconsistency:

- diagrams increasingly reflect the banking architecture
- some legacy wiki and API docs still reflect an older runtime picture

### Between Concept and Implementation

- canonical RabbitMQ topology is broader than the currently active runtime
- logical split between Banking Core and AI Platform Capabilities is documented, but not yet enforced physically
- tenant-aware behavior is discussed more strongly than it is actually implemented in banking services

## 9. Recomendações Estruturais

### Keep

- banking orchestration in `orchestrator`
- deterministic tool model
- business contracts in `api-business`
- selective RabbitMQ adoption

### Improve

- define one authoritative async strategy note: BullMQ vs RabbitMQ
- stop letting `api-web` look like a second orchestrator over time
- keep `api-business` banking contracts stable while replacing mocks underneath
- bring tenant-aware behavior into real business implementations
- make entity resolution explicit before broadening sensitive operations

### Architectural Direction

The best next direction is not a big rewrite. It is:

1. deepen the banking core
2. reduce documentation and ownership drift
3. formalize queue responsibilities
4. shrink legacy orchestration outside `orchestrator`

## Gaps Encontrados

- banking services still mock-backed
- runtime ownership still partially hybrid
- RabbitMQ broader topology still mostly declarative
- `api-business` still mixes banking core and AI platform concerns
- API and wiki docs still behind the actual implementation

## Riscos

- `api-web` and `orchestrator` both looking like runtime brains
- `api-business` turning into a mixed monolith
- queue strategy becoming ambiguous
- sensitive actions expanding before entity resolution matures
- tenant concerns becoming expensive to retrofit later

## Recomendações

- treat the current banking runtime as the primary architecture and align legacy surfaces to it
- keep `api-business` as the business API, but stop calling it decoupled from LLM/chat at the app level
- preserve BullMQ for internal orchestrator jobs and RabbitMQ for cross-service async work
- use the new RabbitMQ topology gradually, not all at once
- update stale docs before they create architectural confusion

## Backlog Sugerido

### Alta

1. Remove architectural ambiguity between `api-web` omnichannel orchestration and `orchestrator`.
   Justification: runtime ownership must become singular.

2. Replace mock-backed banking services with repository-backed implementations.
   Justification: this is the main gap between architecture and business reality.

3. Update `docs/api/*`, `docs/wiki/*`, and omnichannel docs to match the current banking runtime.
   Justification: the code and the story need to stop diverging.

4. Formalize the BullMQ versus RabbitMQ rule in one canonical architecture note.
   Justification: async strategy ambiguity is a scale risk.

5. Introduce explicit entity resolution for cards and other banking products.
   Justification: sensitive operations should not rely on implicit defaults.

### Média

6. Bring real tenant-aware behavior into banking services and future repositories.
   Justification: current tenant plumbing is stronger than current tenant behavior.

7. Activate one additional RabbitMQ domain flow only where async value is clear.
   Justification: prove the topology through one meaningful new workload, not by overbuilding.

8. Expand active specialist coverage for customer and credit flows.
   Justification: current banking scenario is still strongest only in cards and investments.

### Baixa

9. Reassess physical separation of Banking Core and AI Platform Capabilities later.
   Justification: logical separation is enough for now; premature splitting would add cost before enough business depth exists.

## O que eu ajustaria agora

- Eu escolheria `orchestrator` como runtime único de referência e começaria a esvaziar o papel orquestrador legado de `api-web`.
- Eu substituiria os mocks bancários de `api-business` por repositories reais mantendo exatamente os contratos atuais.
- Eu atualizaria imediatamente `docs/api/*`, `docs/wiki/*` e a documentação omnichannel para alinhar narrativa e implementação.
- Eu formalizaria em um único documento a regra prática de BullMQ versus RabbitMQ e passaria a usá-la como critério para novos fluxos.
- Eu removeria a dependência de seleção implícita de cartão antes de expandir operações sensíveis ou de alto impacto.
