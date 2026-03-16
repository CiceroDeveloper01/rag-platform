export interface ApiClient {
  post<TRequest, TResponse = unknown>(
    path: string,
    payload: TRequest,
  ): Promise<TResponse>;

  get<TResponse = unknown>(path: string): Promise<TResponse>;
}
