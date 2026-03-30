import { Injectable } from "@nestjs/common";

@Injectable()
export class SimulateLoanToolService {
  execute(payload: { amount: number; installments?: number | null }) {
    const installments = payload.installments ?? 24;
    const monthlyRate = 0.021;
    const installmentAmount =
      (payload.amount * (1 + monthlyRate * installments)) / installments;

    return {
      amount: payload.amount,
      installments,
      monthlyRate,
      installmentAmount: Number(installmentAmount.toFixed(2)),
    };
  }
}
