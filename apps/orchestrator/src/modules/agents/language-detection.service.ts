import { Injectable } from "@nestjs/common";

export type SupportedAgentLanguage = "pt" | "en" | "es";

export interface LanguageDetectionResult {
  detectedLanguage: SupportedAgentLanguage;
  confidence: number;
  usedFallback: boolean;
}

const LANGUAGE_KEYWORDS: Record<SupportedAgentLanguage, string[]> = {
  pt: [
    "onde",
    "minha",
    "fatura",
    "anexo",
    "arquivo",
    "documento",
    "preciso",
    "suporte",
    "humano",
    "atendente",
    "olá",
    "voce",
    "você",
  ],
  en: [
    "where",
    "invoice",
    "document",
    "file",
    "attachment",
    "support",
    "human",
    "agent",
    "please",
    "hello",
    "help",
    "billing",
  ],
  es: [
    "donde",
    "dónde",
    "factura",
    "archivo",
    "adjunto",
    "documento",
    "soporte",
    "humano",
    "agente",
    "hola",
    "ayuda",
    "necesito",
  ],
};

@Injectable()
export class LanguageDetectionService {
  detect(text: string): LanguageDetectionResult {
    const normalizedText = normalize(text);

    if (!normalizedText) {
      return this.createFallbackResult();
    }

    const tokens = normalizedText.split(/\s+/).filter(Boolean);
    const scores = this.scoreLanguages(tokens, normalizedText);
    const rankedLanguages = Object.entries(scores).sort(
      (left, right) => right[1] - left[1],
    ) as Array<[SupportedAgentLanguage, number]>;

    const [winner, winnerScore] = rankedLanguages[0] ?? ["pt", 0];
    const runnerUpScore = rankedLanguages[1]?.[1] ?? 0;

    if (winnerScore === 0 || winnerScore - runnerUpScore < 0.35) {
      return this.createFallbackResult();
    }

    return {
      detectedLanguage: winner,
      confidence: clampConfidence(winnerScore),
      usedFallback: false,
    };
  }

  getResponseInstruction(language: SupportedAgentLanguage): string {
    switch (language) {
      case "en":
        return "You must answer in English because the user wrote in English. Do not assume Portuguese as the default language. Keep technical identifiers, API names, endpoints, payloads, code elements, and proper nouns unchanged.";
      case "es":
        return "Debes responder en español porque el usuario escribió en español. No asumas portugués como idioma predeterminado. Conserva sin traducir identificadores técnicos, nombres de API, endpoints, payloads, elementos de código y nombres propios.";
      case "pt":
      default:
        return "Você deve responder em português porque o usuário escreveu em português. Não assuma outro idioma como padrão quando o idioma do usuário estiver claro. Preserve sem traduzir identificadores técnicos, nomes de API, endpoints, payloads, elementos de código e nomes próprios.";
    }
  }

  private createFallbackResult(): LanguageDetectionResult {
    return {
      detectedLanguage: "pt",
      confidence: 0,
      usedFallback: true,
    };
  }

  private scoreLanguages(
    tokens: string[],
    normalizedText: string,
  ): Record<SupportedAgentLanguage, number> {
    const tokenSet = new Set(tokens);

    return {
      pt:
        this.countKeywordMatches(tokenSet, LANGUAGE_KEYWORDS.pt) +
        this.scoreAccentHints(normalizedText, "pt"),
      en:
        this.countKeywordMatches(tokenSet, LANGUAGE_KEYWORDS.en) +
        this.scoreAccentHints(normalizedText, "en"),
      es:
        this.countKeywordMatches(tokenSet, LANGUAGE_KEYWORDS.es) +
        this.scoreAccentHints(normalizedText, "es"),
    };
  }

  private countKeywordMatches(tokens: Set<string>, keywords: string[]): number {
    return keywords.reduce(
      (total, keyword) => total + (tokens.has(keyword) ? 1 : 0),
      0,
    );
  }

  private scoreAccentHints(
    text: string,
    language: SupportedAgentLanguage,
  ): number {
    if (language === "es" && /[¿¡ñ]/u.test(text)) {
      return 1;
    }

    if (language === "pt" && /[ãõç]/u.test(text)) {
      return 1;
    }

    return 0;
  }
}

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s¿¡]/gu, " ")
    .replace(/\s+/g, " ");
}

function clampConfidence(value: number): number {
  return Number(Math.min(1, Math.max(0, value / 3)).toFixed(2));
}
