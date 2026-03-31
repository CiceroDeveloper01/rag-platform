# Database Setup

This directory contains the scripts required to initialize and manage the database used by the **Intelligent Automation Platform**.

The database uses **PostgreSQL** with the **pgvector** extension to store vector embeddings and enable semantic search for Retrieval Augmented Generation (RAG).

---

# Database Technology

Database Engine
PostgreSQL

Vector Extension
pgvector

pgvector allows storing vector embeddings and performing similarity search directly inside PostgreSQL.

---

# Directory Structure

```
database
├ README.md
└ migrations
   ├ 01_enable_pgvector.sql
   ├ 02_create_sources_table.sql
   ├ 03_create_documents_table.sql
   ├ 04_create_queries_table.sql
   ├ 05_create_vector_index.sql
   └ 06_seed_example_data.sql
```

---

# How to Access the Database

Open a terminal at the **root of the project**.

Connect to the PostgreSQL container using:

```bash
psql -h localhost -p 5433 -U rag -d ragdb
```

Connection credentials:

```
user: rag
password: rag
database: ragdb
```

When connected successfully you should see something similar to:

```
ragdb=#
```

---

# Running the Migration Scripts

After connecting to the database using `psql`, run the migration scripts in the following order.

These scripts create the extension, tables, indexes and example data required for the project.

```
\i database/migrations/01_enable_pgvector.sql
\i database/migrations/02_create_sources_table.sql
\i database/migrations/03_create_documents_table.sql
\i database/migrations/04_create_queries_table.sql
\i database/migrations/05_create_vector_index.sql
\i database/migrations/06_seed_example_data.sql
```

Each script performs the following action:

| Script                        | Description                         |
| ----------------------------- | ----------------------------------- |
| 01_enable_pgvector.sql        | Enables the pgvector extension      |
| 02_create_sources_table.sql   | Creates the sources table           |
| 03_create_documents_table.sql | Creates the documents table         |
| 04_create_queries_table.sql   | Creates the queries table           |
| 05_create_vector_index.sql    | Creates the vector search index     |
| 06_seed_example_data.sql      | Inserts example records for testing |

---

# Resetting the Database

If you need to remove the database completely and recreate it from scratch, follow these steps.

Remove the PostgreSQL volume:

```bash
docker volume rm rag-platform_postgres_data
```

This command removes the PostgreSQL volume and **deletes all stored data**.

After removing the volume, start the containers again:

```bash
docker compose up -d
```

This command recreates the database container.

After the container is recreated the database will be empty.

You must connect again using `psql` and run the migration scripts once more.

Then re-run all migration scripts.

---

# Database Tables

The database contains the following tables:

- sources
- documents
- queries

---

# Table Overview

## sources

Stores original documents ingested into the system.

Examples include:

- PDF documents
- Markdown files
- Web pages
- Knowledge base articles

---

## documents

Stores document chunks and vector embeddings.

Each row represents a portion of a document used during semantic retrieval.

The embedding column stores the vector representation of the text.

---

## queries

Stores user questions and generated responses.

This table is useful for:

- monitoring usage
- analytics
- debugging
- auditing

---

# Example Semantic Search Query

Vector similarity search uses the `<->` operator.

Example query:

```sql
SELECT content
FROM documents
ORDER BY embedding <-> '[0.1,0.2,0.3,...]'
LIMIT 5;
```

This query returns the most semantically similar document chunks.

---

# Summary

This database structure enables:

- scalable semantic search
- vector similarity queries
- document traceability
- query logging
- efficient Retrieval Augmented Generation pipelines

The combination of **PostgreSQL** and **pgvector** provides a powerful vector database solution for AI applications.
