# Omnichannel Module

The `omnichannel` module adds a backend-first omnichannel gateway and MCP-style integration layer on top of the Intelligent Automation Platform.

## Runtime Boundary

The current target architecture treats the `orchestrator` as the primary runtime for live channel message execution:

```text
channels
  -> inbound queue
  -> orchestrator
  -> agents
  -> outbound
```

The `api` should remain focused on:

- dashboard and analytics
- connector management
- execution history
- configuration and administration

For that reason, omnichannel runtime execution in the `api` is now disabled by default through:

- `OMNICHANNEL_API_RUNTIME_ENABLED=false`

When disabled, these runtime-oriented API entry points are intentionally unavailable:

- `POST /api/v1/omnichannel/dev/process`
- `POST /api/v1/omnichannel/telegram/webhook`
- `POST /api/v1/omnichannel/email/inbound-dev`

This preserves backward compatibility in code while making the runtime boundary explicit for production deployments.

## Goal

Provide a single orchestration layer capable of:

- receiving normalized inbound messages
- deciding whether retrieval is needed
- invoking the existing RAG capability through an adapter
- executing an initial agent response
- persisting message and execution data
- exposing operational data for dashboards
- dispatching outbound responses through channel-specific adapters
- exposing a dedicated dashboard/query layer for operational analytics

## Main domain objects

- `OmnichannelMessage`
- `OmnichannelExecution`
- `OmnichannelConnector`
- `OmnichannelMetricSnapshot`
- tracked `Execution`
- tracked `ExecutionEvent`

## Main enums

- `MessageChannel`
- `MessageDirection`
- `OmnichannelMessageStatus`
- `OmnichannelExecutionStatus`
- `ConnectorHealthStatus`

## Orchestration flow

```text
Normalized inbound payload
  -> persist inbound message
  -> start execution trace
  -> evaluate knowledge usage policy
  -> optionally query existing knowledge adapter
  -> evaluate AI usage policy
  -> execute agent
  -> persist execution result
  -> persist outbound message
  -> dispatch outbound message through channel dispatcher
  -> append execution timeline events
  -> refresh channel metrics snapshot
```

## Channel flows in this stage

The orchestrator channel edge is now standardized around:

- a common `ChannelListener` contract
- inbound adapters per channel
- outbound services per channel
- a shared bootstrap that starts registered listeners through DI
- a shared HTTP helper with timeout, transient retry for idempotent requests, logs, metrics and traces

### Legacy API webhook path

The following path still exists for compatibility and controlled development scenarios, but it should not be used as the production runtime entrypoint when the orchestrator edge is available.

### Telegram webhook

```text
Telegram Update
  -> POST /api/v1/omnichannel/telegram/webhook
  -> TelegramWebhookController
  -> TelegramWebhookService
  -> TelegramChannelAdapter / TelegramMessageNormalizer
  -> OmnichannelOrchestratorService
  -> TelegramOutboundDispatcher
  -> Telegram Bot API sendMessage
```

### E-mail DEV

```text
DEV Email payload
  -> POST /api/v1/omnichannel/email/inbound-dev
  -> EmailInboundDevController
  -> EmailInboundDevService
  -> DevEmailInboundProvider
  -> EmailChannelAdapter / EmailMessageNormalizer
  -> OmnichannelOrchestratorService
  -> DevEmailOutboundDispatcher
  -> simulated transport log
```

## Integration with existing knowledge retrieval

The module does not create a new knowledge retrieval engine.

It uses:

- `SearchService` through `ExistingRagGatewayAdapter`
- existing AI infrastructure through `DefaultAgentExecutor`

This keeps the omnichannel core decoupled while still reusing the validated retrieval capability.

## AI usage policy

The omnichannel module includes an `AiUsagePolicyService` that runs after knowledge retrieval and before the agent executor.

It enforces:

- maximum prompt tokens per request
- maximum completion tokens per request
- maximum inbound message size
- per-user and per-channel rate limiting for AI execution

The policy uses the normalized inbound message plus retrieved context to estimate prompt size conservatively before calling the LLM.

This helps protect the platform against:

- oversized prompts
- repeated abusive traffic from the same user/channel pair
- uncontrolled token usage

Relevant environment variables:

- `AI_MAX_PROMPT_TOKENS`
- `AI_MAX_COMPLETION_TOKENS`
- `MAX_MESSAGE_CHARACTERS`

## Endpoints

- `GET /api/v1/omnichannel/overview`
- `GET /api/v1/omnichannel/requests`
- `GET /api/v1/omnichannel/requests/:id`
- `GET /api/v1/omnichannel/executions`
- `GET /api/v1/omnichannel/executions/:id`
- `GET /api/v1/omnichannel/connectors`
- `GET /api/v1/omnichannel/metrics/channels`
- `GET /api/v1/omnichannel/metrics/latency`
- `GET /api/v1/omnichannel/metrics/rag-usage`
  - legacy route name kept for compatibility; it reports knowledge retrieval usage
- `PATCH /api/v1/omnichannel/connectors/:id/toggle`
- `POST /api/v1/omnichannel/dev/process` - disabled by default
- `POST /api/v1/omnichannel/telegram/webhook` - disabled by default
- `POST /api/v1/omnichannel/email/inbound-dev` - disabled by default

### Telegram webhook payload example

```json
{
  "update_id": 9001,
  "message": {
    "message_id": 42,
    "date": 1742000000,
    "text": "Preciso do manual da plataforma",
    "chat": {
      "id": 123456,
      "type": "private"
    },
    "from": {
      "id": 777,
      "username": "cicero",
      "first_name": "Cicero",
      "last_name": "Dev"
    }
  }
}
```

### DEV email inbound payload example

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

## Configuration

Added environment variables:

- `OMNICHANNEL_ENABLED`
- `OMNICHANNEL_API_RUNTIME_ENABLED`
- `OMNICHANNEL_DEFAULT_AGENT`
- `OMNICHANNEL_RAG_KEYWORDS`
- `OMNICHANNEL_ALWAYS_USE_RAG`
- `OMNICHANNEL_AUTO_RESPONSE`
- `OMNICHANNEL_TELEGRAM_ENABLED`
- `OMNICHANNEL_TELEGRAM_BOT_TOKEN`
- `OMNICHANNEL_TELEGRAM_WEBHOOK_SECRET`
- `OMNICHANNEL_TELEGRAM_DEFAULT_PARSE_MODE`
- `OMNICHANNEL_EMAIL_ENABLED`
- `OMNICHANNEL_EMAIL_PROVIDER`
- `OMNICHANNEL_EMAIL_FROM`
- `OMNICHANNEL_EMAIL_DEV_MODE`

## Local configuration notes

- PostgreSQL keeps running on `localhost:5433`
- Telegram uses Bot API polling in local orchestrator execution and can evolve to webhook later
- the e-mail provider in this phase is development-only and does not use SMTP/IMAP
- secrets must come from `.env`, never from code
- `Email` and `WhatsApp` listeners default to `manual` mode in the orchestrator edge
- `Telegram` uses polling locally and remains the reference implementation for a real inbound adapter
- outbound adapters are configured through environment variables such as:
  - `EMAIL_LISTENER_API_BASE_URL`
  - `EMAIL_LISTENER_OUTBOUND_PATH`
  - `WHATSAPP_LISTENER_API_BASE_URL`
  - `WHATSAPP_LISTENER_OUTBOUND_PATH`
  - `TELEGRAM_LISTENER_BOT_TOKEN`
  - `*_TIMEOUT_MS`
  - `*_RETRY_*`

## Channel payload examples

### Telegram inbound

```json
{
  "update_id": 9001,
  "message": {
    "message_id": 42,
    "date": 1742000000,
    "text": "Preciso do manual da plataforma",
    "chat": {
      "id": 123456,
      "type": "private"
    },
    "from": {
      "id": 777,
      "username": "cicero"
    }
  }
}
```

### Email inbound

```json
{
  "externalMessageId": "mail-42",
  "fromEmail": "docs@rag-platform.dev",
  "fromName": "Equipe Docs",
  "toEmail": "support@rag-platform.dev",
  "subject": "Manual atualizado",
  "body": "Segue o manual atualizado.",
  "conversationId": "thread-42",
  "metadata": {
    "ticketId": "TCK-42"
  }
}
```

### WhatsApp inbound

```json
{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "metadata": {
              "phone_number_id": "123",
              "display_phone_number": "+5511999999999"
            },
            "contacts": [
              {
                "wa_id": "5511999999999",
                "profile": {
                  "name": "Maria"
                }
              }
            ],
            "messages": [
              {
                "id": "wamid.100",
                "from": "5511999999999",
                "timestamp": "1710000000",
                "text": {
                  "body": "Oi, preciso de ajuda"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

## Observability

The channel edge extends the omnichannel core telemetry with:

- structured logs for webhook receive, normalize and dispatch stages
- spans:
  - `telegram.webhook.receive`
  - `telegram.normalize`
  - `telegram.dispatch`
  - `email.dev.receive`
  - `email.parse`
  - `email.dispatch`
- Prometheus metrics:
  - `omnichannel_channel_inbound_total{channel}`
  - `omnichannel_channel_outbound_total{channel,status}`
  - `omnichannel_dispatch_latency_ms{channel}`
  - `omnichannel_webhook_failures_total{channel}`
  - `ai_requests_total{channel}`
  - `ai_requests_blocked_total{channel,reason}`
  - `ai_tokens_used_total{channel}`
  - `ai_policy_rejections_total{channel,reason}`

The dashboard/query layer also adds:

- spans:
  - `omnichannel.dashboard.overview`
  - `omnichannel.dashboard.requests`
  - `omnichannel.dashboard.metrics`
- Prometheus metrics:
  - `omnichannel_dashboard_queries_total{endpoint,status}`
  - `omnichannel_dashboard_latency_ms{endpoint}`

## Dashboard query capabilities

This stage adds a read-optimized query layer for:

- overview aggregates
- paginated requests listing
- request details with joined execution data
- paginated executions listing
- channel metrics
- latency metrics by channel
- knowledge retrieval usage analytics
- connector status and toggle

The data is read from:

- `omnichannel_messages`
- `omnichannel_executions`
- `omnichannel_connectors`
- `omnichannel_metric_snapshots`

Recommended local migration for this stage:

- `database/migrations/10_create_omnichannel_query_indexes.sql`

## Database

Migration:

- `database/migrations/09_create_omnichannel_tables.sql`
- `database/migrations/13_create_execution_tracking_tables.sql`

Tables:

- `omnichannel_messages`
- `omnichannel_executions`
- `omnichannel_connectors`
- `omnichannel_metric_snapshots`
- `executions`
- `execution_events`

## What comes next

This step intentionally stops at the core.

Future phases can add:

- SMTP/IMAP or provider-based e-mail transport
- richer Telegram capabilities such as attachments and commands
- real adapters for Teams, WhatsApp, Slack, SMS, Voice and Roam
- outbound retry policies
- dashboard visualizations backed by real omnichannel data

# Tenant Scope

Operational dashboard and request/execution query endpoints now resolve tenant scope from `x-tenant-id`.

Example:

```http
GET /api/v1/omnichannel/requests
x-tenant-id: tenant-acme
```

The current implementation filters request and execution views by `metadata.tenantId` stored on inbound omnichannel messages.
