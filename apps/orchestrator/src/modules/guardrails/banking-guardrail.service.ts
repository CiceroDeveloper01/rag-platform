import { Injectable } from "@nestjs/common";
import { SupportedAgentLanguage } from "../agents/language-detection.service";
import { DecisionResult } from "../decision-layer/decision.types";
import { hasConfirmationIntent } from "../specialists/shared/banking-message.utils";

@Injectable()
export class BankingGuardrailService {
  evaluate(payload: {
    decision: DecisionResult;
    messageBody: string;
    language: SupportedAgentLanguage;
  }): { blocked: boolean; responseText?: string; handoffRequested?: boolean } {
    if (payload.decision.requiresHumanHandoff) {
      return {
        blocked: true,
        responseText: localizedHandoffMessage(payload.language),
        handoffRequested: true,
      };
    }

    if (
      payload.decision.sensitivity === "sensitive" &&
      !hasConfirmationIntent(payload.messageBody)
    ) {
      return {
        blocked: true,
        responseText: localizedConfirmationMessage(payload.language),
      };
    }

    return {
      blocked: false,
    };
  }
}

function localizedConfirmationMessage(language: SupportedAgentLanguage): string {
  switch (language) {
    case "en":
      return "This is a sensitive operation. Please confirm explicitly that you want to block the card.";
    case "es":
      return "Esta es una operacion sensible. Confirma explicitamente si deseas bloquear la tarjeta.";
    case "pt":
    default:
      return "Essa e uma operacao sensivel. Confirme explicitamente se deseja bloquear o cartao.";
  }
}

function localizedHandoffMessage(language: SupportedAgentLanguage): string {
  switch (language) {
    case "en":
      return "I am routing your case to a human specialist for continuity.";
    case "es":
      return "Estoy encaminando tu caso a un especialista humano para continuidad.";
    case "pt":
    default:
      return "Estou encaminhando seu caso para um especialista humano dar continuidade.";
  }
}
