CREATE TABLE IF NOT EXISTS rag_documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  source VARCHAR(255) NOT NULL,
  embedding VECTOR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_documents_source ON rag_documents (source);
CREATE INDEX IF NOT EXISTS idx_rag_documents_created_at ON rag_documents (created_at DESC);
