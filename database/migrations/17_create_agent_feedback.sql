CREATE TABLE IF NOT EXISTS agent_feedback (
  id BIGSERIAL PRIMARY KEY,
  response_id VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_feedback_response_id
  ON agent_feedback (response_id);

CREATE INDEX IF NOT EXISTS idx_agent_feedback_created_at
  ON agent_feedback (created_at DESC);
