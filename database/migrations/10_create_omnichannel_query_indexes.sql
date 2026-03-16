CREATE INDEX IF NOT EXISTS idx_omnichannel_messages_channel_received_at
  ON omnichannel_messages (channel, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_omnichannel_messages_conversation_id
  ON omnichannel_messages (conversation_id);

CREATE INDEX IF NOT EXISTS idx_omnichannel_messages_status
  ON omnichannel_messages (status);

CREATE INDEX IF NOT EXISTS idx_omnichannel_messages_sender_id
  ON omnichannel_messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_omnichannel_executions_message_id
  ON omnichannel_executions (message_id);

CREATE INDEX IF NOT EXISTS idx_omnichannel_executions_status_started_at
  ON omnichannel_executions (status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_omnichannel_executions_agent_name
  ON omnichannel_executions (agent_name);

CREATE INDEX IF NOT EXISTS idx_omnichannel_metric_snapshots_channel_period
  ON omnichannel_metric_snapshots (channel, period DESC);
