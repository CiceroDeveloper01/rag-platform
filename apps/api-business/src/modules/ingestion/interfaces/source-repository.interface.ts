import { SourceRecord } from './source-record.interface';

export interface CreateSourcePayload {
  filename: string;
  type: string;
  storageKey?: string | null;
  storageUrl?: string | null;
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
      filename?: string;
      type?: string;
      storageKey?: string | null;
      storageUrl?: string | null;
    },
  ): Promise<SourceRecord | null>;
  delete(sourceId: number): Promise<void>;
}

export const SOURCE_REPOSITORY = Symbol('SOURCE_REPOSITORY');
