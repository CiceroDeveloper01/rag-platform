import { Injectable } from "@nestjs/common";
import { DecisionResult } from "../decision-layer/decision.types";
import { SpecialistResult } from "../specialists/specialist.types";

@Injectable()
export class ResponseComposerService {
  compose(payload: {
    decision: DecisionResult;
    specialistResult: SpecialistResult;
  }): {
    responseText: string;
    responseMetadata: Record<string, unknown>;
  } {
    const sanitizedText = this.maskSensitiveData(payload.specialistResult.responseText);

    return {
      responseText: sanitizedText,
      responseMetadata: {
        intentDetected: payload.decision.intent,
        specialistSelected: payload.decision.specialist,
        usedRag: payload.specialistResult.usedRag,
        toolCalls: payload.specialistResult.toolCalls,
        handoffRequested: payload.specialistResult.handoffRequested ?? false,
      },
    };
  }

  private maskSensitiveData(text: string): string {
    return [
      {
        pattern:
          /\b(cartao|cartão|card|tarjeta)\s*(?:numero|número|number|num|nro|#|:)?\s*(\d{8,19})\b/giu,
        replacement: (_match: string, label: string, value: string) =>
          `${label} ${maskIdentifier(value)}`,
      },
      {
        pattern:
          /\b(cpf|documento|document|passport|ssn|tax id)\s*(?:numero|número|number|#|:)?\s*(\d{6,14})\b/giu,
        replacement: (_match: string, label: string, value: string) =>
          `${label} ${maskIdentifier(value)}`,
      },
      {
        pattern:
          /\b(conta|account|cuenta)\s*(?:numero|número|number|#|:)?\s*(\d{5,12})\b/giu,
        replacement: (_match: string, label: string, value: string) =>
          `${label} ${maskIdentifier(value)}`,
      },
    ].reduce((currentText, rule) => {
      return currentText.replace(rule.pattern, rule.replacement as never);
    }, text);
  }
}

function maskIdentifier(value: string): string {
  if (value.length <= 4) {
    return value;
  }

  return `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
}
