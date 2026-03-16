import type {
  RagQueryRequest,
  RagQueryResponse as RagQueryResult,
} from '@rag-platform/contracts';

export type { RagQueryRequest, RagQueryResult };

export interface IRagGateway {
  query(request: RagQueryRequest): Promise<RagQueryResult>;
}

export const OMNICHANNEL_RAG_GATEWAY = Symbol('OMNICHANNEL_RAG_GATEWAY');
