# RAG Flow

This document describes the current state of the RAG flow implemented in the repository.

## 1. Ingestion Flow

```text
User sends a document through a channel
  -> Channel adapter normalizes the payload
  -> Message enters the inbound queue
  -> Orchestrator runs the supervisor
  -> Supervisor routes to document-agent
  -> document-agent emits execute.register-document
  -> FlowExecutionProcessor triggers the ingestion pipeline
  -> Tools perform parsing, chunking, embeddings, metadata storage, and indexing
  -> Document and chunks become available for later retrieval
```

### Important Notes

- channels do not execute business ingestion logic
- agents decide the flow
- tools perform the technical work
- the current pipeline uses internal API document registration and local vector fallback in the orchestrator

## 2. Query Flow

```text
User asks a question
  -> Orchestrator runs the agent graph
  -> conversation-agent requests retrieval
  -> RetrievalService uses internal search as the primary path
  -> If that path fails and an embedding exists, local fallback in VectorRepository is used
  -> Retrieved context is combined with memory when available
  -> FlowExecutionProcessor delivers the response to the channel
```

## 3. Embeddings and Vector Search

In the current codebase:

- document and query embeddings are generated in the orchestrator
- a local `VectorRepository` exists as fallback
- the primary search path depends on an internal API endpoint

This means the current RAG flow is functional, but the final vector persistence strategy should still be treated as an evolving area.

## 4. Context Assembly

The context used by agents can combine:

- retrieved RAG chunks
- conversation memory
- language instructions and operational context

## 5. RAG Path Observability

The runtime currently records:

- retrieval metrics
- indexing metrics
- `rag_retrieval` traces
- execution events for `document-agent` and related tools
