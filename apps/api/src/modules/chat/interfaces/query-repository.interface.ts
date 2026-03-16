import { QueryRecord } from './query-record.interface';

export interface CreateQueryPayload {
  question: string;
  answer: string;
  userId?: number | null;
  conversationId?: number | null;
}

export interface QueryRepositoryInterface {
  create(payload: CreateQueryPayload): Promise<QueryRecord>;
}

export const QUERY_REPOSITORY = Symbol('QUERY_REPOSITORY');
