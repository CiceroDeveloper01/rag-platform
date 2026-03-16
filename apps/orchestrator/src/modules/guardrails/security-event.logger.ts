import { Injectable } from "@nestjs/common";
import { AppLoggerService } from "@rag-platform/observability";

export type SecurityEventType =
  | "prompt_injection_detected"
  | "policy_violation"
  | "unauthorized_action"
  | "invalid_payload";

@Injectable()
export class SecurityEventLogger {
  constructor(private readonly logger: AppLoggerService) {}

  log(eventType: SecurityEventType, metadata: Record<string, unknown>): void {
    this.logger.warn("Security event detected", SecurityEventLogger.name, {
      eventType,
      ...metadata,
    });
  }
}
