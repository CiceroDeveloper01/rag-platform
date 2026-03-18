import type { ErrorCode } from './error-codes';

export interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: unknown;
  traceId?: string;
  timestamp: string;
}
