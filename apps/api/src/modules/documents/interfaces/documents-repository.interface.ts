import { DocumentRecord } from './document-record.interface';

export interface CreateDocumentPayload {
  tenantId: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
  sourceId?: number | null;
}

export interface ListDocumentsPayload {
  tenantId: string;
  limit: number;
  offset: number;
  query?: string;
  order: 'asc' | 'desc';
}

export interface DocumentsRepositoryInterface {
  create(payload: CreateDocumentPayload): Promise<DocumentRecord>;
  createMany(payload: CreateDocumentPayload[]): Promise<DocumentRecord[]>;
  list(payload: ListDocumentsPayload): Promise<DocumentRecord[]>;
  findById(
    documentId: number,
    tenantId: string,
  ): Promise<DocumentRecord | null>;
  update(
    documentId: number,
    tenantId: string,
    payload: { content?: string; metadata?: Record<string, unknown> },
  ): Promise<DocumentRecord | null>;
  delete(documentId: number, tenantId: string): Promise<void>;
}

export const DOCUMENTS_REPOSITORY = Symbol('DOCUMENTS_REPOSITORY');
