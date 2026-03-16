CREATE TABLE IF NOT EXISTS inbound_messages (
  id SERIAL PRIMARY KEY,
  channel TEXT NOT NULL,
  external_message_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (channel, external_message_id)
);

CREATE INDEX IF NOT EXISTS idx_inbound_messages_channel_created_at
  ON inbound_messages (channel, created_at DESC);
