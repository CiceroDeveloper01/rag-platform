export interface RedisCacheClient {
  isOpen: boolean;
  scanIterator(options: {
    MATCH: string;
    COUNT: number;
  }): AsyncIterable<unknown>;
  del(keys: string[]): Promise<number>;
}
