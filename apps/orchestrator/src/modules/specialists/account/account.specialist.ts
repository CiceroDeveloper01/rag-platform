import { Injectable } from "@nestjs/common";
import { GetAccountsToolService } from "../../tools/banking/get-accounts.tool";
import { GetCustomerProfileToolService } from "../../tools/banking/get-customer-profile.tool";
import { SpecialistExecutionContext, SpecialistResult } from "../specialist.types";

@Injectable()
export class AccountSpecialist {
  constructor(
    private readonly getCustomerProfileToolService: GetCustomerProfileToolService,
    private readonly getAccountsToolService: GetAccountsToolService,
  ) {}

  async execute(context: SpecialistExecutionContext): Promise<SpecialistResult> {
    const profile = this.getCustomerProfileToolService.execute({
      customerId:
        typeof context.message.metadata?.userId === "string"
          ? context.message.metadata.userId
          : undefined,
    });
    const accounts = this.getAccountsToolService.execute();

    return {
      responseText: [
        `Localizei o perfil ${profile.customerName}, segmento ${profile.segment}.`,
        `Voce possui ${accounts.length} contas ativas.`,
        ...accounts.map(
          (account) =>
            `- ${account.type}: saldo de R$ ${account.balance.toFixed(2)} e status ${account.status}.`,
        ),
      ].join("\n"),
      usedRag: false,
      retrievedDocuments: [],
      toolCalls: ["GetCustomerProfile", "GetAccounts"],
    };
  }
}
