# Telegram

## Overview

The Telegram channel runs in `apps/orchestrator` and follows this flow:

`TelegramPollingService -> TelegramInboundAdapter -> inbound-messages -> InboundMessageProcessor -> flow-execution -> FlowExecutionProcessor -> TelegramOutboundService`

The `api` does not execute the Telegram runtime in production.

The Telegram adapter only:

- receives the raw update
- normalizes the canonical payload
- publishes to the inbound queue

It does not execute:

- business routing
- document ingestion
- parsing
- RAG indexing

## Creating the Bot

1. Open BotFather in Telegram.
2. Run `/newbot`.
3. Define the display name.
4. Define the username ending in `bot`.
5. Store:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_BOT_USERNAME`

## Configuration

In [apps/orchestrator/.env](/home/cicero/projects/rag-platform/apps/orchestrator/.env):

```env
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_LISTENER_ENABLED=true
TELEGRAM_LISTENER_MODE=polling
TELEGRAM_LISTENER_POLLING_INTERVAL_MS=10000
TELEGRAM_LISTENER_API_BASE_URL=https://api.telegram.org
```

The bootstrap validates `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_USERNAME` when the channel is enabled.

## Running Locally

1. Start Redis and the main stack.
2. Ensure `apps/api` is running for internal clients.
3. Start `apps/orchestrator`.
4. Open the bot in Telegram and send a message.

## Testing the Bot

Supported commands:

- `/start`
- `/status`
- `/help`

Demo flow:

1. Send `hello`
2. The bot should reply with `hello from RAG platform`

## Observability

The runtime publishes logs, metrics, and traces for these stages:

- `telegram_update_received`
- `telegram_message_queued`
- `telegram_job_processing`
- `telegram_agent_execution`
- `telegram_response_sent`

## Example Flow

Inbound message:

```text
hello
```

Queued payload:

```json
{
  "eventType": "message.received",
  "channel": "TELEGRAM",
  "externalMessageId": "501:99",
  "conversationId": "1001",
  "messageType": "text",
  "from": "ada",
  "chatId": "1001",
  "messageId": "99",
  "text": "hello",
  "body": "hello",
  "metadata": {
    "telegramChatId": 1001,
    "telegramUserId": 42,
    "updateId": 501,
    "messageId": 99
  }
}
```

Outbound response:

```text
hello from RAG platform
```
