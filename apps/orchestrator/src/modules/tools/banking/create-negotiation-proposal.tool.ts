import { Injectable } from "@nestjs/common";

@Injectable()
export class CreateNegotiationProposalToolService {
  execute(payload: { amount: number }) {
    return {
      entryAmount: Number((payload.amount * 0.2).toFixed(2)),
      installmentCount: 6,
      installmentAmount: Number(((payload.amount * 0.8) / 6).toFixed(2)),
      discountPercentage: 12,
    };
  }
}
