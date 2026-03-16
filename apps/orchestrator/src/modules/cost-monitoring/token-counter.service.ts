import { Injectable } from "@nestjs/common";

@Injectable()
export class TokenCounterService {
  countInputTokens(prompt: string): number {
    return estimateTokens(prompt);
  }

  countOutputTokens(response: string): number {
    return estimateTokens(response);
  }
}

function estimateTokens(text: string): number {
  const normalized = text.trim();

  if (!normalized) {
    return 0;
  }

  return Math.max(1, Math.ceil(normalized.length / 4));
}
