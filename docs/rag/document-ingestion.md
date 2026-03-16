# Document Ingestion

## Model

Document ingestion is now `agent-first` and `channel-agnostic`.

Flow:

`channel message -> supervisor-agent -> document-agent -> document ingestion tools -> document index -> retrieval posterior`

## Indexed Metadata

Each indexed chunk carries metadata such as:

- `tenantId`
- `channel`
- `conversationId`
- `documentId`
- `fileName`
- `mimeType`
- `createdAt`

## Retrieval After Ingestion

When a user asks a question:

`user question -> supervisor-agent -> conversation-agent -> retrieval tool -> vector repository / search -> context builder -> reply`
