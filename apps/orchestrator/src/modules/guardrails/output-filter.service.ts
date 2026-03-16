import { Injectable } from "@nestjs/common";
import { SecurityEventLogger } from "./security-event.logger";

const BLOCKED_OUTPUT_PATTERNS = [
  /password/i,
  /secret/i,
  /admin\s+token/i,
  /system\s+prompt/i,
];

@Injectable()
export class OutputFilterService {
  constructor(private readonly securityEventLogger: SecurityEventLogger) {}

  assertSafe(output: string, metadata: Record<string, unknown>): void {
    const matchedPattern = BLOCKED_OUTPUT_PATTERNS.find((pattern) =>
      pattern.test(output),
    );

    if (!matchedPattern) {
      return;
    }

    this.securityEventLogger.log("unauthorized_action", {
      ...metadata,
      pattern: matchedPattern.source,
    });

    throw new Error("Generated output blocked by output filter");
  }
}
