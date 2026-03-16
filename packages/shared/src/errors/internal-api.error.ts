import { BaseAppError } from "./base-app.error";

export class InternalApiError extends BaseAppError {
  constructor(
    message: string,
    public readonly statusCode: number,
    details?: Record<string, unknown>,
  ) {
    super(message, "INTERNAL_API_ERROR", details);
  }
}
