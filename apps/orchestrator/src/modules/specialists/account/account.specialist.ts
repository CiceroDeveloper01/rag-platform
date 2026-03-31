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
    const profileResult = await this.getCustomerProfileToolService.execute({
      userId:
        context.message.userId ??
        (typeof context.message.metadata?.userId === "string"
          ? context.message.metadata.userId
          : context.message.from),
      tenantId: context.tenantId,
      correlationId: context.message.externalMessageId,
      payload: {},
    });
    const accounts = this.getAccountsToolService.execute();
    const profile = (profileResult.data ?? {
      fullName: "Cliente RAG Platform",
      segment: "segmento indisponivel",
    }) as {
      fullName: string;
      segment: string;
    };

    return {
      responseText: [
        `Localizei o perfil ${profile.fullName}, segmento ${profile.segment}.`,
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
