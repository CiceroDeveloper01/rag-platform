CREATE TABLE IF NOT EXISTS executions (
  id BIGSERIAL PRIMARY KEY,
  source_type VARCHAR(100) NOT NULL,
  source_id BIGINT NOT NULL,
  channel VARCHAR(32) NOT NULL,
  correlation_id VARCHAR(128) NOT NULL,
  trace_id VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL,
  error_message TEXT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT executions_source_unique UNIQUE (source_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_executions_source ON executions (source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_executions_channel ON executions (channel);
CREATE INDEX IF NOT EXISTS idx_executions_trace_id ON executions (trace_id);
CREATE INDEX IF NOT EXISTS idx_executions_started_at ON executions (started_at);

CREATE TABLE IF NOT EXISTS execution_events (
  id BIGSERIAL PRIMARY KEY,
  execution_id BIGINT NOT NULL REFERENCES executions (id) ON DELETE CASCADE,
  event_name VARCHAR(64) NOT NULL,
  metadata JSONB NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execution_events_execution_id ON execution_events (execution_id);
CREATE INDEX IF NOT EXISTS idx_execution_events_occurred_at ON execution_events (occurred_at);
CREATE INDEX IF NOT EXISTS idx_execution_events_execution_occurred ON execution_events (execution_id, occurred_at);
