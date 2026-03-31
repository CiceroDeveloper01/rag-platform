import { Injectable } from "@nestjs/common";

@Injectable()
export class GetDebtStatusToolService {
  execute() {
    return {
      overdueAmount: 3420.9,
      contractsInArrears: 1,
      oldestDelayDays: 23,
    };
  }
}
