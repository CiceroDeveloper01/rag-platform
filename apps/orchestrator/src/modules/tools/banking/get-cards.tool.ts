import { Injectable } from "@nestjs/common";

@Injectable()
export class GetCardsToolService {
  execute() {
    return [
      {
        brand: "Visa Infinite",
        last4: "4432",
        status: "ativo",
        limit: 18000,
      },
    ];
  }
}
