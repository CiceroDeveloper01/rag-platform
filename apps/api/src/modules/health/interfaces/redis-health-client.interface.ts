export interface RedisHealthClient {
  ping(): Promise<string>;
}
