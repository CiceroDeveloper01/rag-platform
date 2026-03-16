CREATE TABLE IF NOT EXISTS queries (
  id SERIAL PRIMARY KEY,
  question TEXT,
  response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
