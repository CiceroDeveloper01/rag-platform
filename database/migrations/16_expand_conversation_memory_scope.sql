ALTER TABLE conversation_memory
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255) NOT NULL DEFAULT 'default';

ALTER TABLE conversation_memory
  ADD COLUMN IF NOT EXISTS channel VARCHAR(32) NOT NULL DEFAULT 'email';

ALTER TABLE conversation_memory
  ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE conversation_memory
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_conversation_memory_scope_created_at
  ON conversation_memory (tenant_id, channel, conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_memory_scope_expires_at
  ON conversation_memory (tenant_id, channel, expires_at);
