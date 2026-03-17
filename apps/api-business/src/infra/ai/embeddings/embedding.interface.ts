export interface EmbeddingServiceInterface {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(
    texts: string[],
    options?: {
      batchSize?: number;
    },
  ): Promise<number[][]>;
}

export const EMBEDDING_SERVICE = Symbol('EMBEDDING_SERVICE');
