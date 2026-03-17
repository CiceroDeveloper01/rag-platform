# Storage Providers

The backend exposes a provider-based storage abstraction for uploaded RAG source files.

The abstraction lives in `apps/api-business/src/common/storage` and is designed to support local development today and cloud object stores later without changing ingestion flows.

## Supported Providers

- `local`
- `s3`
- `azure`
- `gcs`

Selection is controlled by:

```text
STORAGE_PROVIDER=local | s3 | azure | gcs
```

## Local Storage

The default development provider stores files under:

```text
storage/documents/
```

Relevant variables:

```text
LOCAL_STORAGE_PATH=storage/documents
LOCAL_STORAGE_BASE_URL=
```

## Cloud Providers

The project includes provider stubs and implementations for:

- Amazon S3
- Azure Blob Storage
- Google Cloud Storage

These providers are selected through environment variables and use the same `FileStorage` contract as the local implementation.

## Security and Validation

Uploaded files are validated before ingestion:

- maximum file size
- allowed file types
- filename sanitization
- metadata sanitization

Configured through:

```text
MAX_DOCUMENT_SIZE_MB=10
ALLOWED_DOCUMENT_TYPES=pdf,txt,md,docx
```

## Important Design Choice

The platform stores the original uploaded file separately from the derived retrieval chunks.

This means:

- object storage is used for source artifacts
- PostgreSQL remains the source of truth for parsed chunks, embeddings, and retrieval data
- the final LLM answer is not stored in object storage by default

## Relationship With Email Providers

The storage abstraction is independent from the email provider layer.

That separation keeps responsibilities clear:

- `common/storage` handles document source file persistence
- `common/email` handles inbound polling, outbound sending, and provider health
