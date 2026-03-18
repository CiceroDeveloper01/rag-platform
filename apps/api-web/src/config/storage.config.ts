import { registerAs } from '@nestjs/config';

const DEFAULT_ALLOWED_TYPES = ['pdf', 'txt', 'md', 'docx'];

export const storageConfig = registerAs('storage', () => ({
  provider: (process.env.STORAGE_PROVIDER ?? 'local').toLowerCase(),
  local: {
    basePath: process.env.LOCAL_STORAGE_PATH ?? 'storage/documents',
    baseUrl: process.env.LOCAL_STORAGE_BASE_URL ?? '',
  },
  s3: {
    bucket: process.env.S3_BUCKET ?? '',
    region: process.env.S3_REGION ?? '',
    endpoint: process.env.S3_ENDPOINT ?? '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? '',
  },
  azure: {
    container: process.env.AZURE_BLOB_CONTAINER ?? '',
    connectionString: process.env.AZURE_BLOB_CONNECTION_STRING ?? '',
    accountUrl: process.env.AZURE_BLOB_ACCOUNT_URL ?? '',
  },
  gcs: {
    bucket: process.env.GCS_BUCKET ?? '',
    projectId: process.env.GCS_PROJECT_ID ?? '',
    keyFilename: process.env.GCS_KEY_FILENAME ?? '',
    publicBaseUrl: process.env.GCS_PUBLIC_BASE_URL ?? '',
  },
  upload: {
    maxDocumentSizeMb: Number.parseInt(
      process.env.MAX_DOCUMENT_SIZE_MB ?? '10',
      10,
    ),
    allowedDocumentTypes: (
      process.env.ALLOWED_DOCUMENT_TYPES ?? DEFAULT_ALLOWED_TYPES.join(',')
    )
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  },
}));
