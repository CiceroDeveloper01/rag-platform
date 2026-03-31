import { Injectable } from "@nestjs/common";

@Injectable()
export class SimulateInvestmentToolService {
  execute(payload: { amount: number; annualRate?: number }) {
    const annualRate = payload.annualRate ?? 0.118;
    const projectedGross = payload.amount * (1 + annualRate);

    return {
      amount: payload.amount,
      annualRate,
      projectedGross: Number(projectedGross.toFixed(2)),
      termMonths: 12,
    };
  }
}
