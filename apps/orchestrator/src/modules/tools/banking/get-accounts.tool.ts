import { Injectable } from "@nestjs/common";

@Injectable()
export class GetAccountsToolService {
  execute() {
    return [
      {
        type: "Conta Corrente",
        number: "123456",
        balance: 15420.55,
        status: "ativa",
      },
      {
        type: "Conta Investimento",
        number: "987654",
        balance: 48200,
        status: "ativa",
      },
    ];
  }
}
