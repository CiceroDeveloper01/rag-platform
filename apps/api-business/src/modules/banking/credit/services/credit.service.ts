import { Injectable } from '@nestjs/common';
import { SimulateCreditRequest } from '../dtos/request/simulate-credit.request';
import { CreditContractResponse } from '../dtos/response/credit-contract.response';
import { CreditLimitResponse } from '../dtos/response/credit-limit.response';
import { CreditSimulationResponse } from '../dtos/response/credit-simulation.response';
import { CreditContractRecord } from '../interfaces/credit-contract-record.interface';
import { CreditSimulationRecord } from '../interfaces/credit-simulation-record.interface';

@Injectable()
export class CreditService {
  private readonly contracts: CreditContractRecord[] = [
    {
      contractId: 'ctr-001',
      productName: 'Personal Loan',
      outstandingBalance: 7450.9,
      nextDueDate: '2026-04-20',
      status: 'active',
    },
  ];

  simulateCredit(request: SimulateCreditRequest): CreditSimulationResponse {
    const estimatedRate = 0.021;
    const totalAmount = Number(
      (
        request.requestedAmount *
        (1 + estimatedRate * request.installmentCount)
      ).toFixed(2),
    );
    const simulation: CreditSimulationRecord = {
      requestedAmount: request.requestedAmount,
      installmentCount: request.installmentCount,
      monthlyInstallment: Number(
        (totalAmount / request.installmentCount).toFixed(2),
      ),
      estimatedRate,
      totalAmount,
    };

    return simulation;
  }

  getContracts(): CreditContractResponse[] {
    return [...this.contracts];
  }

  getLimit(): CreditLimitResponse {
    return {
      totalLimit: 30000,
      availableLimit: 18000,
      preApproved: true,
    };
  }
}
