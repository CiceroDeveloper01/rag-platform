# API Endpoints

This document consolidates the current HTTP surface of the Intelligent Automation Platform backend.

## Base URL

- Local: `http://localhost:3001`

## Authentication

### `POST /auth/login`

Authenticates a user and sets the session cookie.

Request:

```json
{
  "email": "demo@ragplatform.dev",
  "password": "demo123"
}
```

### `GET /auth/me`

Returns the authenticated user from the active session.

### `POST /auth/logout`

Revokes the current session and clears the cookie.

## Health and metrics

### `GET /health`

Returns service status, uptime, version and database status.

### `GET /metrics`

Returns Prometheus metrics in text format.

## Documents and ingestion

### `POST /ingestion/upload`

Multipart upload for PDF and TXT documents. The ingestion pipeline extracts text, chunks content, generates embeddings and persists chunks.

Fields:

- `file`
- `chunkSize` optional
- `chunkOverlap` optional

### `GET /documents`

List document chunks with pagination and search.

Query params:

- `limit`
- `offset`
- `q`
- `order`

### `GET /documents/:id`

Returns one document chunk.

### `PATCH /documents/:id`

Updates chunk content and metadata.

### `DELETE /documents/:id`

Deletes a document chunk.

### `GET /sources`

Lists uploaded sources with filename, type, timestamps and aggregated chunk counts when available.

### `PATCH /sources/:id`

Updates source metadata such as filename or type.

### `DELETE /sources/:id`

Deletes the source and its associated chunks.

## Search

### `POST /search`

Runs semantic search against stored chunks.

Request:

```json
{
  "query": "What is pgvector?",
  "top_k": 5
}
```

## Chat

### `POST /chat`

Runs the end-to-end knowledge-assisted chat flow. Supports JSON and SSE streaming responses.

Request:

```json
{
  "question": "What is pgvector?",
  "conversationId": 1,
  "topK": 5,
  "maxContextCharacters": 6000,
  "stream": true
}
```

SSE events:

- `context`
- `token`
- `done`
- `error`

## Conversations

### `GET /conversations`

Lists conversations for the authenticated user.

### `GET /conversations/:id`

Returns a single conversation and its messages.

### `POST /conversations`

Creates a new conversation.

### `POST /conversations/:id/messages`

Appends a message to an existing conversation.

### `DELETE /conversations/:id`

Deletes a conversation and its messages.

## Omnichannel

### `GET /api/v1/omnichannel/overview`

Returns omnichannel operational overview for dashboard use.

Response fields:

- `totalRequests`
- `successCount`
- `errorCount`
- `avgLatencyMs`
- `p95LatencyMs`
- `ragUsagePercentage`
- `activeConnectors`
- `requestsLast24h`
- `requestsLast7d`
- `channels`

### `GET /api/v1/omnichannel/requests`

Lists inbound and outbound omnichannel messages.

Supported query params:

- `channel`
- `status`
- `startDate`
- `endDate`
- `conversationId`
- `senderId`
- `usedRag`
- `limit`
- `offset`
- `sortOrder`

Response:

```json
{
  "items": [
    {
      "id": 1,
      "channel": "TELEGRAM",
      "conversationId": "123456",
      "senderName": "Cicero Dev",
      "senderAddress": "cicero",
      "normalizedTextPreview": "Preciso do manual da plataforma",
      "status": "PROCESSED",
      "receivedAt": "2026-03-13T12:00:00.000Z",
      "processedAt": "2026-03-13T12:00:01.000Z",
      "latencyMs": 120,
      "usedRag": true
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

### `GET /api/v1/omnichannel/requests/:id`

Returns a single omnichannel message.

Returns:

- `message`
- `execution`

### `GET /api/v1/omnichannel/executions`

Lists omnichannel executions.

Supported query params:

- `channel`
- `agentName`
- `usedRag`
- `status`
- `startDate`
- `endDate`
- `limit`
- `offset`
- `sortOrder`

### `GET /api/v1/omnichannel/executions/:id`

Returns one omnichannel execution.

### `GET /api/v1/omnichannel/connectors`

Lists configured connectors and health data.

### `GET /api/v1/omnichannel/metrics/channels`

Returns aggregated metric snapshots per channel.

### `GET /api/v1/omnichannel/metrics/latency`

Returns average and p95 latency grouped by channel.

### `GET /api/v1/omnichannel/metrics/rag-usage`

Returns overall and per-channel knowledge retrieval usage rates.

### `POST /api/v1/omnichannel/dev/process`

Processes an already normalized internal payload for development and integration testing.

### `PATCH /api/v1/omnichannel/connectors/:id/toggle`

Toggles or explicitly sets a connector enabled state.

Request:

```json
{
  "enabled": false
}
```

### `POST /api/v1/omnichannel/telegram/webhook`

Receives Telegram updates, normalizes text messages and routes them through the omnichannel orchestrator.

Notes:

- accepts only simple text messages in this MVP
- can validate `x-telegram-bot-api-secret-token` when configured

### `POST /api/v1/omnichannel/email/inbound-dev`

Receives a DEV/mock e-mail payload, parses sender/recipient/subject/body and routes the message through the omnichannel orchestrator.

Request:

```json
{
  "fromName": "Equipe Docs",
  "fromEmail": "docs@rag-platform.dev",
  "toEmail": "support@rag-platform.dev",
  "subject": "Manual atualizado",
  "body": "Segue o manual atualizado.",
  "externalMessageId": "mail-1",
  "metadata": {
    "ticketId": "TCK-42"
  }
}
```

## Error format

All endpoints are wrapped by the global exception filter and return consistent payloads.

Example:

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-03-13T12:00:00.000Z",
  "path": "/documents"
}
```
