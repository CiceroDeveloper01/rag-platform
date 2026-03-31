# API Documentation

This document provides an overview of the main API endpoints exposed by the **Intelligent Automation Platform**.

The API is responsible for:

- receiving channel requests
- orchestrating AI execution
- providing analytics data
- powering the operational dashboard
- exposing machine-readable contracts through Swagger/OpenAPI

---

# Base URL

Example:

http://localhost:3001/api/v1

Swagger UI:

http://localhost:3001/swagger

---

# Omnichannel Endpoints

## Telegram Webhook

Receives Telegram messages.

POST

/api/v1/omnichannel/telegram/webhook

Purpose:

- receive Telegram updates
- normalize payload
- send message to orchestrator
- skip duplicate inbound messages using `(channel, external_message_id)` idempotency

---

## Email Inbound (Dev Provider)

Receives inbound email messages.

POST

/api/v1/omnichannel/email/inbound-dev

Purpose:

- simulate inbound email
- normalize payload
- process request through orchestrator
- skip duplicate inbound messages using `(channel, external_message_id)` idempotency

## Email Provider Health

GET

/api/v1/health/email

Purpose:

- validate the configured email provider
- confirm SMTP / IMAP readiness when applicable
- expose provider-level availability to dashboards and operations

---

# Analytics Endpoints

These endpoints power the dashboard.

Language analytics are also exposed for the realtime dashboard through:

- `GET /api/v1/analytics/languages`
- `GET /api/v1/analytics/languages/timeline`

---

## Overview Metrics

GET

/api/v1/omnichannel/overview

Returns:

- total requests
- success count
- failure count
- average latency
- knowledge retrieval usage rate

---

## Requests List

GET

/api/v1/omnichannel/requests

Returns paginated list of requests.

Supported filters include:

- channel
- status
- startDate
- endDate
- conversationId
- senderId
- usedRag
- offset
- limit

Fields include:

- request id
- channel
- sender
- message preview
- execution status
- latency
- timestamp

---

## Request Details

GET

/api/v1/omnichannel/requests/:id

Returns detailed request information.

Includes:

- inbound message
- execution metadata
- knowledge retrieval usage
- latency
- response payload

---

# Metrics Endpoints

---

## Channel Metrics

GET

/api/v1/omnichannel/metrics/channels

Returns number of requests per channel.

---

## Latency Metrics

GET

/api/v1/omnichannel/metrics/latency

Returns latency distribution.

---

## Knowledge Retrieval Usage Metrics

GET

/api/v1/omnichannel/metrics/rag-usage

Returns percentage of requests using knowledge retrieval.

---

# Connector Endpoints

---

## List Connectors

GET

/api/v1/omnichannel/connectors

Returns connector status.

---

## Toggle Connector

PATCH

/api/v1/omnichannel/connectors/:id/toggle

Enables or disables connector.

---

# Knowledge Retrieval and Chat Endpoints

## Chat

POST

/api/v1/chat

Purpose:

- run the knowledge-assisted chat pipeline
- retrieve relevant chunks
- assemble contextual prompts
- return a final answer or stream SSE events

## Search

POST

/api/v1/search

Purpose:

- perform semantic retrieval
- return top matching chunks
- support `limit` and `top_k`

## Ingestion Upload

POST

/api/v1/ingestion/upload

Purpose:

- upload PDF, TXT, Markdown or DOCX files
- chunk content
- generate embeddings
- store retrieval-ready documents
- persist the original uploaded file using the configured storage provider

## Documents

GET /api/v1/documents
GET /api/v1/documents/:id
POST /api/v1/documents
PATCH /api/v1/documents/:id
DELETE /api/v1/documents/:id

Purpose:

- manage persisted document chunks and metadata

## Conversations

GET /api/v1/conversations
GET /api/v1/conversations/:id
POST /api/v1/conversations
POST /api/v1/conversations/:id/messages
DELETE /api/v1/conversations/:id

Purpose:

- manage persisted chat conversations
- append user and assistant messages

---

# Health Endpoints

The platform exposes both legacy and versioned health routes. The operational recommendation is to use the versioned routes:

- `GET /api/v1/health`
- `GET /api/v1/health/db`
- `GET /api/v1/health/redis`
- `GET /api/v1/health/storage`
- `GET /api/v1/health/rag`
- `GET /api/v1/health/email`

The Prometheus metrics endpoint remains available at:

- `GET /metrics`
- `GET /api/v1/metrics`

See also:

- [Swagger / OpenAPI](SWAGGER.md)
- [Storage Providers](../storage/STORAGE.md)

GET

/health

Purpose:

- infrastructure monitoring
- container health checks

## Metrics Endpoint

GET

/metrics

Purpose:

- expose Prometheus-compatible metrics
- support operational dashboards and alerting
