CREATE TABLE IF NOT EXISTS agent_evaluations (
  id BIGSERIAL PRIMARY KEY,
  response_id VARCHAR(255) NOT NULL,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  context JSONB NULL,
  relevance_score NUMERIC(5,4) NOT NULL,
  coherence_score NUMERIC(5,4) NOT NULL,
  safety_score NUMERIC(5,4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_evaluations_response_id
  ON agent_evaluations (response_id);

CREATE INDEX IF NOT EXISTS idx_agent_evaluations_created_at
  ON agent_evaluations (created_at DESC);
