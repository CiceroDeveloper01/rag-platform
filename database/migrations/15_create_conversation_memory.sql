CREATE TABLE IF NOT EXISTS conversation_memory (
  id BIGSERIAL PRIMARY KEY,
  conversation_id VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL,
  message TEXT NOT NULL,
  embedding VECTOR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_memory_conversation_id
  ON conversation_memory (conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_memory_created_at
  ON conversation_memory (created_at DESC);
