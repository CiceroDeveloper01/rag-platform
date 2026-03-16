CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  source_id INT REFERENCES sources(id),
  content TEXT,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
