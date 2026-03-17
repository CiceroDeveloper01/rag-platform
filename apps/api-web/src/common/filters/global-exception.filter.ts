import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';
import { DEFAULT_ERROR_MESSAGE } from '../constants/http.constants';
import { ErrorCodes, type ErrorCode } from '../errors/error-codes';
import { TraceContextHelper } from '../observability/helpers/trace-context.helper';
import { ApiErrorResponse } from '../interfaces/api-error-response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, details, code } =
      this.normalizeException(exception);
    const errorResponse: ApiErrorResponse = {
      code,
      message,
      details,
      traceId: TraceContextHelper.getTraceId(),
      timestamp: new Date().toISOString(),
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        {
          err: exception,
          path: request.originalUrl,
          method: request.method,
        },
        'Unhandled exception',
      );
    } else {
      this.logger.warn(
        {
          err: exception,
          path: request.originalUrl,
          method: request.method,
        },
        'Handled HTTP exception',
      );
    }

    response.status(statusCode).json(errorResponse);
  }

  private normalizeException(exception: unknown): {
    statusCode: number;
    message: string;
    details?: unknown;
    code: ErrorCode;
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        return {
          statusCode,
          message: exceptionResponse,
          code: this.mapStatusToCode(statusCode),
        };
      }

      const responseBody = exceptionResponse as {
        message?: string | string[];
        error?: string;
        details?: unknown;
      };
      const message = responseBody.message;
      const normalizedMessage = Array.isArray(message)
        ? message.join('; ')
        : message;

      return {
        statusCode,
        message: normalizedMessage ?? exception.message,
        details: Array.isArray(message) ? message : responseBody.details,
        code: Array.isArray(message)
          ? ErrorCodes.VALIDATION_ERROR
          : this.mapStatusToCode(statusCode),
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: DEFAULT_ERROR_MESSAGE,
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
    };
  }

  private mapStatusToCode(statusCode: number): ErrorCode {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCodes.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCodes.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCodes.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCodes.NOT_FOUND;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCodes.TOO_MANY_REQUESTS;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCodes.SERVICE_UNAVAILABLE;
      default:
        return ErrorCodes.INTERNAL_SERVER_ERROR;
    }
  }
}
