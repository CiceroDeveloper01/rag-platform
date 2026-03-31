import { Injectable } from "@nestjs/common";

@Injectable()
export class GetCustomerProfileToolService {
  execute(payload: { customerId?: string; customerName?: string }) {
    return {
      customerId: payload.customerId ?? "cust-demo-001",
      customerName: payload.customerName ?? "Cliente RAG Platform",
      segment: "Van Gogh Digital",
      riskProfile: "moderado",
      branch: "Agencia Paulista",
    };
  }
}
