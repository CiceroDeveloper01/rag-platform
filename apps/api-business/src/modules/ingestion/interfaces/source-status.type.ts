export type SourceIngestionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export const TERMINAL_SOURCE_INGESTION_STATUSES = ['COMPLETED', 'FAILED'] as const;

export type SourceProcessingStep =
  | 'RECEIVED'
  | 'PARSING'
  | 'CHUNKING'
  | 'EMBEDDING'
  | 'INDEXING'
  | 'COMPLETED'
  | 'FAILED';
