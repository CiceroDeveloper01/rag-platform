import {
  SourceIngestionStatus,
  SourceProcessingStep,
} from "./source-status.type";
import { SourceRecord } from './source-record.interface';

export interface CreateSourcePayload {
  tenantId: string;
  filename: string;
  type: string;
  sourceChannel?: string | null;
  storageKey?: string | null;
  storageUrl?: string | null;
  ingestionStatus?: SourceIngestionStatus;
  ingestionCurrentStep?: SourceProcessingStep | null;
  ingestionFailureReason?: string | null;
  ingestionAttemptCount?: number;
  lastIngestionAttemptAt?: Date | null;
  lastIngestionEventId?: string | null;
  lastIngestionCorrelationId?: string | null;
  lastFailureAt?: Date | null;
}

export interface ListSourcesPayload {
  limit: number;
  offset: number;
  query?: string;
  type?: string;
  order: 'asc' | 'desc';
}

export interface SourceRepositoryInterface {
  create(payload: CreateSourcePayload): Promise<SourceRecord>;
  list(payload: ListSourcesPayload): Promise<SourceRecord[]>;
  findById(sourceId: number): Promise<SourceRecord | null>;
  update(
    sourceId: number,
    payload: {
      tenantId?: string;
      filename?: string;
      type?: string;
      sourceChannel?: string | null;
      ingestionStatus?: SourceIngestionStatus;
      ingestionCurrentStep?: SourceProcessingStep | null;
      ingestionFailureReason?: string | null;
      storageKey?: string | null;
      storageUrl?: string | null;
      processingStartedAt?: Date | null;
      completedAt?: Date | null;
      ingestionAttemptCount?: number;
      lastIngestionAttemptAt?: Date | null;
      lastIngestionEventId?: string | null;
      lastIngestionCorrelationId?: string | null;
      lastFailureAt?: Date | null;
    },
  ): Promise<SourceRecord | null>;
  delete(sourceId: number): Promise<void>;
}

export const SOURCE_REPOSITORY = Symbol('SOURCE_REPOSITORY');
