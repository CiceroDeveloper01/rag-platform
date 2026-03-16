import { Injectable } from "@nestjs/common";
import { InboundMessagePayload } from "../queue/inbound-message.types";
import { SecurityEventLogger } from "./security-event.logger";

const SUSPICIOUS_PATTERNS = [
  /ignore\s+instructions/i,
  /reveal\s+system\s+prompt/i,
  /system\s+override/i,
  /admin\s+access/i,
];

@Injectable()
export class PromptInjectionGuard {
  constructor(private readonly securityEventLogger: SecurityEventLogger) {}

  assertSafe(message: InboundMessagePayload): void {
    const candidateText = [message.subject ?? "", message.body]
      .join(" ")
      .trim();

    const matchedPattern = SUSPICIOUS_PATTERNS.find((pattern) =>
      pattern.test(candidateText),
    );

    if (!matchedPattern) {
      return;
    }

    this.securityEventLogger.log("prompt_injection_detected", {
      externalMessageId: message.externalMessageId,
      channel: message.channel,
      pattern: matchedPattern.source,
    });

    throw new Error("Inbound message blocked by prompt injection guard");
  }
}
