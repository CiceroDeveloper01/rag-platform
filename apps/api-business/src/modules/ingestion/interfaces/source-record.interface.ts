import {
  SourceIngestionStatus,
  SourceProcessingStep,
} from "./source-status.type";

export interface SourceRecord {
  id: number;
  tenantId: string;
  filename: string;
  uploadedAt: Date;
  type: string | null;
  sourceChannel?: string | null;
  ingestionStatus: SourceIngestionStatus;
  ingestionCurrentStep?: SourceProcessingStep | null;
  ingestionFailureReason?: string | null;
  storageKey?: string | null;
  storageUrl?: string | null;
  processingStartedAt?: Date | null;
  completedAt?: Date | null;
  updatedAt?: Date | null;
  chunksCount?: number;
  ingestionAttemptCount?: number;
  lastIngestionAttemptAt?: Date | null;
  lastIngestionEventId?: string | null;
  lastIngestionCorrelationId?: string | null;
  lastFailureAt?: Date | null;
}
