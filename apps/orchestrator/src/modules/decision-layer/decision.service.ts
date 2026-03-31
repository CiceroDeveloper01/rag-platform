import { Injectable } from "@nestjs/common";
import {
  BANKING_ROUTING_KEYWORDS,
  containsAnyKeyword,
  normalizeBankingText,
} from "./banking-routing-keywords";
import { DecisionResult } from "./decision.types";

@Injectable()
export class DecisionService {
  classify(message: string): DecisionResult {
    const normalized = normalizeBankingText(message);

    if (matchesAny(normalized, ["humano", "atendente", "gerente humano", "human agent", "support agent"])) {
      return {
        intent: "HUMAN_HANDOFF",
        strategy: "HANDOFF",
        specialist: null,
        suggestedTools: [],
        confidence: 0.91,
        sensitivity: "normal",
        requiresHumanHandoff: true,
      };
    }

    if (
      containsAnyKeyword(normalized, [
        ...BANKING_ROUTING_KEYWORDS.investment,
        "renda fixa",
        "aplicar",
      ])
    ) {
      return {
        intent: "INVESTMENT_ADVISORY",
        strategy: "HYBRID",
        specialist: "investment",
        suggestedTools: ["GetInvestmentProducts", "SimulateInvestment"],
        confidence: 0.9,
        sensitivity: "normal",
        requiresHumanHandoff: false,
      };
    }

    if (
      containsAnyKeyword(normalized, [
        ...BANKING_ROUTING_KEYWORDS.card,
        "perdi meu cartao",
        "perdi meu cartão",
        "bloquear cartao",
        "bloquear cartão",
      ])
    ) {
      const sensitive = matchesAny(normalized, ["perdi", "roubaram", "roubo", "fraude", "bloquear"]);
      return {
        intent: "CARD_SERVICES",
        strategy: sensitive ? "HYBRID" : "TOOL",
        specialist: "card",
        suggestedTools: sensitive ? ["BlockCard"] : ["GetCards", "GetInvoice"],
        confidence: sensitive ? 0.94 : 0.88,
        sensitivity: sensitive ? "sensitive" : "normal",
        requiresHumanHandoff: false,
      };
    }

    if (
      containsAnyKeyword(normalized, [
        ...BANKING_ROUTING_KEYWORDS.credit,
        "credito",
        "crédito",
      ])
    ) {
      return {
        intent: "CREDIT_REQUEST",
        strategy: "HYBRID",
        specialist: "credit",
        suggestedTools: ["SimulateLoan"],
        confidence: 0.88,
        sensitivity: "normal",
        requiresHumanHandoff: false,
      };
    }

    if (
      containsAnyKeyword(normalized, [
        ...BANKING_ROUTING_KEYWORDS.debt,
        "negociar",
        "renegociar",
        "parcela atrasada",
      ])
    ) {
      return {
        intent: "DEBT_NEGOTIATION",
        strategy: "HYBRID",
        specialist: "debt",
        suggestedTools: ["GetDebtStatus", "CreateNegotiationProposal"],
        confidence: 0.89,
        sensitivity: "normal",
        requiresHumanHandoff: false,
      };
    }

    if (
      containsAnyKeyword(normalized, [
        ...BANKING_ROUTING_KEYWORDS.account,
        "profile",
      ])
    ) {
      return {
        intent: "ACCOUNT_SERVICES",
        strategy: "TOOL",
        specialist: "account",
        suggestedTools: ["GetCustomerProfile", "GetAccounts"],
        confidence: 0.84,
        sensitivity: "normal",
        requiresHumanHandoff: false,
      };
    }

    if (matchesAny(normalized, ["horario", "horário", "politica", "política", "taxa", "documento necessario", "documento necessário", "faq", "como funciona", "regra"])) {
      return {
        intent: "FAQ_INSTITUTIONAL",
        strategy: "RAG",
        specialist: "faq",
        suggestedTools: [],
        confidence: 0.8,
        sensitivity: "normal",
        requiresHumanHandoff: false,
      };
    }

    return {
      intent: "UNKNOWN",
      strategy: "RAG",
      specialist: "faq",
      suggestedTools: [],
      confidence: 0.42,
      sensitivity: "normal",
      requiresHumanHandoff: false,
    };
  }
}

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword.normalize("NFD").replace(/\p{Diacritic}/gu, " ")));
}
