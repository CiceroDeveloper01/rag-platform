import { Injectable } from "@nestjs/common";

@Injectable()
export class GetInvestmentProductsToolService {
  execute() {
    return [
      { name: "CDB Liquidez Diaria", risk: "baixo", benchmark: "102% CDI" },
      { name: "LCI 12 meses", risk: "baixo", benchmark: "94% CDI" },
      { name: "Fundo Multimercado Premium", risk: "medio", benchmark: "CDI + 3%" },
    ];
  }
}
