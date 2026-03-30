import { Injectable } from "@nestjs/common";
import { SecurityEventLogger } from "./security-event.logger";

type AgentName =
  | "document-agent"
  | "conversation-agent"
  | "handoff-agent"
  | "account-manager-agent";

const POLICY_MAP: Record<AgentName, string> = {
  "document-agent": "execute.register-document",
  "conversation-agent": "execute.reply-conversation",
  "handoff-agent": "execute.handoff",
  "account-manager-agent": "execute.reply-conversation",
};

@Injectable()
export class PolicyEngineService {
  constructor(private readonly securityEventLogger: SecurityEventLogger) {}

  assertAuthorized(agent: AgentName, action: string): void {
    const expectedAction = POLICY_MAP[agent];

    if (expectedAction === action) {
      return;
    }

    this.securityEventLogger.log("policy_violation", {
      agent,
      attemptedAction: action,
      expectedAction,
    });

    throw new Error("Agent action blocked by policy engine");
  }
}
