ALTER TABLE sources
ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255) NOT NULL DEFAULT 'default-tenant';

ALTER TABLE sources
ADD COLUMN IF NOT EXISTS ingestion_attempt_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE sources
ADD COLUMN IF NOT EXISTS last_ingestion_attempt_at TIMESTAMPTZ NULL;

ALTER TABLE sources
ADD COLUMN IF NOT EXISTS last_ingestion_event_id TEXT NULL;

ALTER TABLE sources
ADD COLUMN IF NOT EXISTS last_ingestion_correlation_id TEXT NULL;

ALTER TABLE sources
ADD COLUMN IF NOT EXISTS last_failure_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_sources_tenant_status_updated_at
  ON sources (tenant_id, ingestion_status, updated_at DESC);
