export interface ApiErrorPayload {
  statusCode?: number;
  message?: string | string[];
  timestamp?: string;
  path?: string;
}

export class ApiClientError extends Error {
  statusCode?: number;
  payload?: ApiErrorPayload;

  constructor(message: string, statusCode?: number, payload?: ApiErrorPayload) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.payload = payload;
  }
}
