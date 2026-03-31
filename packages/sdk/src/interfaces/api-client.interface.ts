export interface ApiRequestOptions {
  headers?: Record<string, string>;
}

export interface ApiClient {
  post<TRequest, TResponse = unknown>(
    path: string,
    payload: TRequest,
    options?: ApiRequestOptions,
  ): Promise<TResponse>;

  get<TResponse = unknown>(
    path: string,
    options?: ApiRequestOptions,
  ): Promise<TResponse>;
}
