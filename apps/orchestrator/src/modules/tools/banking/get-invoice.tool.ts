import { Injectable } from "@nestjs/common";

@Injectable()
export class GetInvoiceToolService {
  execute() {
    return {
      amountDue: 1280.44,
      dueDate: "2026-04-10",
      minimumPayment: 320.11,
      status: "aberta",
    };
  }
}
