/*
===============================================
Seed Example Data
RAG Platform Database

This script inserts example data for testing
the vector search and RAG pipeline.

This data is only for development and demo
purposes.

Run this script AFTER all migration scripts.

Example execution:

\i database/migrations/06_seed_example_data.sql
===============================================
*/

-- Example source document
INSERT INTO sources (name, type)
VALUES ('example_manual.pdf', 'pdf');

-- Example document chunks
INSERT INTO documents (source_id, content, metadata)
VALUES
(
  1,
  'PostgreSQL is an advanced open-source relational database system.',
  '{"page": 1, "section": "introduction"}'
),
(
  1,
  'pgvector is a PostgreSQL extension designed for vector similarity search.',
  '{"page": 2, "section": "pgvector"}'
),
(
  1,
  'Retrieval Augmented Generation combines vector search with large language models.',
  '{"page": 3, "section": "rag"}'
);

-- Example queries
INSERT INTO queries (question, response)
VALUES
(
  'What is pgvector?',
  'pgvector is a PostgreSQL extension used for storing and searching vector embeddings.'
),
(
  'What is RAG?',
  'RAG stands for Retrieval Augmented Generation, combining vector retrieval with LLMs.'
);
