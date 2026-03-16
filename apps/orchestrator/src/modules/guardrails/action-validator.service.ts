import { Injectable } from "@nestjs/common";
import { FlowExecutionPayload } from "../queue/flow-execution.types";
import { SecurityEventLogger } from "./security-event.logger";

@Injectable()
export class ActionValidatorService {
  constructor(private readonly securityEventLogger: SecurityEventLogger) {}

  assertValid(payload: FlowExecutionPayload): void {
    const isValid =
      typeof payload.externalMessageId === "string" &&
      payload.externalMessageId.length > 0 &&
      typeof payload.channel === "string" &&
      payload.channel.length > 0 &&
      (payload.context === undefined ||
        (typeof payload.context === "object" && payload.context !== null));

    if (isValid) {
      return;
    }

    this.securityEventLogger.log("invalid_payload", {
      payload,
    });

    throw new Error("Flow execution payload blocked by validator");
  }
}
