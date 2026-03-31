import { Injectable } from "@nestjs/common";
import { FlowExecutionPayload } from "../queue/flow-execution.types";
import { SecurityEventLogger } from "./security-event.logger";

@Injectable()
export class ActionValidatorService {
  constructor(private readonly securityEventLogger: SecurityEventLogger) {}

  assertValid(payload: FlowExecutionPayload): void {
    if (this.isValid(payload)) {
      return;
    }

    this.securityEventLogger.log("invalid_payload", { payload });

    throw new Error("Flow execution payload blocked by validator");
  }

  private isValid(payload: FlowExecutionPayload): boolean {
    return (
      this.isValidString(payload.externalMessageId) &&
      this.isValidString(payload.channel) &&
      this.isValidContext(payload.context)
    );
  }

  private isValidString(value: unknown): value is string {
    return typeof value === "string" && value.length > 0;
  }

  private isValidContext(value: unknown): boolean {
    return (
      value === undefined ||
      (typeof value === "object" && value !== null)
    );
  }
}
