# Runtime Flow

## Principle

Channels transport events. The orchestrator controls execution.

- channels receive external provider events
- adapters normalize a canonical payload
- the `inbound-messages` queue hands work to the `orchestrator`
- the `supervisor-agent` decides the next action
- specialized agents plan execution
- tools perform technical operations
- the `flow-execution` queue completes downstream work
- outbound adapters send the response back to the originating channel

## Rules

- channels do not perform business routing
- channels do not perform document ingestion
- channels do not perform RAG indexing
- agents decide based on the canonical payload
- tools remain reusable and channel-agnostic
