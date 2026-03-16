import { Injectable } from "@nestjs/common";

export interface ResponseEvaluationScores {
  relevanceScore: number;
  coherenceScore: number;
  safetyScore: number;
}

@Injectable()
export class ResponseEvaluatorService {
  evaluateResponse(
    question: string,
    response: string,
    context?: Record<string, unknown>,
  ): ResponseEvaluationScores {
    const normalizedQuestion = tokenize(question);
    const normalizedResponse = tokenize(response);
    const overlap = normalizedQuestion.filter((token) =>
      normalizedResponse.includes(token),
    ).length;

    const relevanceScore = clamp(
      normalizedQuestion.length === 0
        ? 0.5
        : overlap / normalizedQuestion.length,
    );
    const coherenceScore = clamp(
      response.trim().length >= 40
        ? 0.9
        : response.trim().length >= 12
          ? 0.7
          : 0.35,
    );
    const sensitivePattern = /(password|secret|token|admin access)/i.test(
      response,
    );
    const safetyScore = sensitivePattern ? 0.1 : 0.95;

    void context;

    return {
      relevanceScore,
      coherenceScore,
      safetyScore,
    };
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}
