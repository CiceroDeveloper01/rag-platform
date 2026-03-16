# ADR-007 — RAG Strategy

## Status

Accepted

## Context

The platform needs to provide grounded, context-aware answers rather than relying only on generic LLM completions. At the same time, the omnichannel module must be able to reuse retrieval capabilities without duplicating another AI pipeline.

The project needed a retrieval strategy that could:

- ingest and chunk documents
- generate embeddings
- perform vector similarity search
- assemble contextual prompts
- keep the orchestration layer decoupled from retrieval internals

## Decision

Adopt a **Retrieval-Augmented Generation (RAG)** strategy using:

- document parsing and chunking
- embeddings generation
- PostgreSQL + `pgvector` vector search
- contextual prompt assembly
- response generation with enriched LLM context

RAG invocation is policy-driven. It can be used directly by the chat flow and optionally by the omnichannel orchestration flow through a gateway adapter instead of a duplicated retrieval engine.

## Consequences

### Positive

- Produces responses grounded in ingested knowledge rather than only model priors.
- Reuses the same retrieval capabilities across chat and omnichannel flows.
- Keeps the omnichannel orchestrator clean by delegating retrieval to a dedicated gateway.
- Enables document-centric use cases such as manuals, policies, and knowledge-base search.
- Maintains a scalable foundation for future improvements such as better chunking strategies or ranking policies.

### Trade-offs

- Adds ingestion, embedding, and retrieval latency compared with direct completions.
- Requires careful management of chunk size, overlap, and prompt assembly quality.
- Retrieval quality depends on document hygiene and indexing discipline.
- The platform accepts this complexity in order to deliver more reliable and context-aware answers.
