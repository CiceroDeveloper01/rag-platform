# Document Agent

## Role

The `document-agent` receives messages classified as `messageType=document`.

It does not know Telegram, Email, or WhatsApp directly. It works only with:

- `messageType`
- `document`
- `attachments`
- `tenantId`
- `channel`
- `conversationId`

## Flow

1. the supervisor routes to `document-agent`
2. `document-agent` emits `execute.register-document`
3. `FlowExecutionProcessor` executes the ingestion pipeline
4. tools perform download, parsing, chunking, embeddings, storage, and indexing
5. the channel receives an acknowledgment
