ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255) NOT NULL DEFAULT 'default-tenant';

CREATE INDEX IF NOT EXISTS idx_documents_tenant_created_at
  ON documents (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_tenant_source_id
  ON documents (tenant_id, source_id);
