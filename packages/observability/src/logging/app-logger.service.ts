import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AppLoggerService {
  private readonly logger = new Logger("AppLogger");

  log(
    message: string,
    context?: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.logger.log(this.buildMessage(message, metadata), context);
  }

  warn(
    message: string,
    context?: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.logger.warn(this.buildMessage(message, metadata), context);
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.logger.error(this.buildMessage(message, metadata), trace, context);
  }

  debug(
    message: string,
    context?: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.logger.debug(this.buildMessage(message, metadata), context);
  }

  private buildMessage(
    message: string,
    metadata?: Record<string, unknown>,
  ): string {
    if (!metadata || Object.keys(metadata).length === 0) {
      return message;
    }

    return `${message} ${JSON.stringify(metadata)}`;
  }
}
