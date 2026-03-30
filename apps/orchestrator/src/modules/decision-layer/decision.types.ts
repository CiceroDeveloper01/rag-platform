export type Intent =
  | "FAQ_INSTITUTIONAL"
  | "ACCOUNT_SERVICES"
  | "CARD_SERVICES"
  | "CREDIT_REQUEST"
  | "INVESTMENT_ADVISORY"
  | "DEBT_NEGOTIATION"
  | "SENSITIVE_OPERATION"
  | "HUMAN_HANDOFF"
  | "UNKNOWN";

export type DecisionStrategy = "RAG" | "SPECIALIST" | "TOOL" | "HYBRID" | "HANDOFF";

export type SpecialistName =
  | "account"
  | "card"
  | "credit"
  | "investment"
  | "debt"
  | "faq";

export interface DecisionResult {
  intent: Intent;
  strategy: DecisionStrategy;
  specialist: SpecialistName | null;
  suggestedTools: string[];
  confidence: number;
  sensitivity: "normal" | "sensitive";
  requiresHumanHandoff: boolean;
}
