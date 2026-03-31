import { Injectable } from "@nestjs/common";
import { SupportedAgentLanguage } from "../agents/language-detection.service";

@Injectable()
export class GuardrailService {
  evaluateSensitiveOperation(payload: {
    requiresConfirmation: boolean;
    confirmed: boolean;
    hasMinimumContext: boolean;
    language: SupportedAgentLanguage;
  }): {
    allowed: boolean;
    responseText?: string;
  } {
    if (!payload.hasMinimumContext) {
      return {
        allowed: false,
        responseText: missingContextMessage(payload.language),
      };
    }

    if (payload.requiresConfirmation && !payload.confirmed) {
      return {
        allowed: false,
        responseText: confirmationMessage(payload.language),
      };
    }

    return {
      allowed: true,
    };
  }
}

function confirmationMessage(language: SupportedAgentLanguage): string {
  switch (language) {
    case "en":
      return "This is a sensitive operation. Please confirm explicitly if you want me to proceed with the card block.";
    case "es":
      return "Esta es una operacion sensible. Confirma explicitamente si quieres que siga con el bloqueo de la tarjeta.";
    case "pt":
    default:
      return "Essa e uma operacao sensivel. Confirme explicitamente se deseja que eu prossiga com o bloqueio do cartao.";
  }
}

function missingContextMessage(language: SupportedAgentLanguage): string {
  switch (language) {
    case "en":
      return "I do not have enough context to execute this action safely.";
    case "es":
      return "No tengo contexto suficiente para ejecutar esta accion con seguridad.";
    case "pt":
    default:
      return "Nao tenho contexto suficiente para executar essa acao com seguranca.";
  }
}
