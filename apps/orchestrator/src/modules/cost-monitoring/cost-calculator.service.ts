import { Injectable } from "@nestjs/common";

const MODEL_PRICING: Record<string, number> = {
  "gpt-4o-mini": 0.0000006,
  "gpt-4.1-mini": 0.0000008,
  default: 0.0000006,
};

@Injectable()
export class CostCalculatorService {
  calculateCost(model: string, tokens: number): number {
    const price = MODEL_PRICING[model] ?? MODEL_PRICING.default;
    return Number((tokens * price).toFixed(6));
  }
}
