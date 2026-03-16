CREATE TABLE IF NOT EXISTS omnichannel_messages (
  id SERIAL PRIMARY KEY,
  external_message_id TEXT NULL,
  conversation_id TEXT NULL,
  channel TEXT NOT NULL,
  direction TEXT NOT NULL,
  sender_id TEXT NULL,
  sender_name TEXT NULL,
  sender_address TEXT NULL,
  recipient_address TEXT NULL,
  subject TEXT NULL,
  body TEXT NOT NULL,
  normalized_text TEXT NOT NULL,
  metadata JSONB NULL,
  status TEXT NOT NULL,
  received_at TIMESTAMP NOT NULL,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_omnichannel_messages_channel_status
  ON omnichannel_messages (channel, status);

CREATE INDEX IF NOT EXISTS idx_omnichannel_messages_conversation_id
  ON omnichannel_messages (conversation_id);

CREATE TABLE IF NOT EXISTS omnichannel_executions (
  id SERIAL PRIMARY KEY,
  message_id INT NOT NULL REFERENCES omnichannel_messages(id) ON DELETE CASCADE,
  trace_id TEXT NOT NULL,
  span_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  used_rag BOOLEAN NOT NULL DEFAULT FALSE,
  rag_query TEXT NULL,
  model_name TEXT NULL,
  input_tokens INT NULL,
  output_tokens INT NULL,
  latency_ms INT NULL,
  status TEXT NOT NULL,
  error_message TEXT NULL,
  started_at TIMESTAMP NOT NULL,
  finished_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_omnichannel_executions_message_id
  ON omnichannel_executions (message_id);

CREATE TABLE IF NOT EXISTS omnichannel_connectors (
  id SERIAL PRIMARY KEY,
  channel TEXT NOT NULL,
  name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  health_status TEXT NOT NULL DEFAULT 'UNKNOWN',
  last_health_check_at TIMESTAMP NULL,
  config_snapshot JSONB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(channel, name)
);

CREATE TABLE IF NOT EXISTS omnichannel_metric_snapshots (
  id SERIAL PRIMARY KEY,
  channel TEXT NOT NULL,
  period DATE NOT NULL,
  total_requests INT NOT NULL DEFAULT 0,
  success_count INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  avg_latency_ms INT NOT NULL DEFAULT 0,
  p95_latency_ms INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(channel, period)
);
