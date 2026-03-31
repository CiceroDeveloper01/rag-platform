import { Injectable } from '@nestjs/common';
import { CreateInvestmentOrderRequest } from '../dtos/request/create-investment-order.request';
import { SimulateInvestmentRequest } from '../dtos/request/simulate-investment.request';
import { InvestmentOrderResponse } from '../dtos/response/investment-order.response';
import {
  InvestmentPortfolioResponse,
  InvestmentPositionResponse,
} from '../dtos/response/investment-portfolio.response';
import { InvestmentProductResponse } from '../dtos/response/investment-product.response';
import { InvestmentSimulationResponse } from '../dtos/response/investment-simulation.response';
import { InvestmentProductRecord } from '../interfaces/investment-product-record.interface';
import { InvestmentSimulationRecord } from '../interfaces/investment-simulation-record.interface';

@Injectable()
export class InvestmentsService {
  private readonly products: InvestmentProductRecord[] = [
    {
      id: 'prod-cdb-001',
      name: 'CDB Liquidez Diaria',
      type: 'cdb',
      minimumAmount: 1000,
      annualRate: 0.118,
      liquidity: 'D+0',
      maturityDays: 365,
    },
    {
      id: 'prod-lci-001',
      name: 'LCI 12 Meses',
      type: 'lci',
      minimumAmount: 5000,
      annualRate: 0.104,
      liquidity: 'No vencimento',
      maturityDays: 360,
    },
  ];

  listProducts(): InvestmentProductResponse[] {
    return [...this.products];
  }

  getPortfolio(): InvestmentPortfolioResponse {
    const positions: InvestmentPositionResponse[] = [
      {
        productId: 'prod-cdb-001',
        productName: 'CDB Liquidez Diaria',
        investedAmount: 15000,
      },
      {
        productId: 'prod-lci-001',
        productName: 'LCI 12 Meses',
        investedAmount: 7500,
      },
    ];

    return {
      customerId: 'cust-001',
      positions,
      totalInvestedAmount: positions.reduce(
        (total, position) => total + position.investedAmount,
        0,
      ),
    };
  }

  simulateInvestment(
    request: SimulateInvestmentRequest,
  ): InvestmentSimulationResponse {
    const product =
      this.products.find((entry) => entry.type === request.productType) ??
      this.products[0];
    const simulation: InvestmentSimulationRecord = {
      investedAmount: request.amount,
      productType: request.productType,
      projectedAmount: Number(
        (
          request.amount *
          (1 + product.annualRate * (request.periodInDays / 365))
        ).toFixed(2),
      ),
      annualRate: product.annualRate,
      periodInDays: request.periodInDays,
    };

    return simulation;
  }

  createOrder(request: CreateInvestmentOrderRequest): InvestmentOrderResponse {
    return {
      orderId: 'ord-001',
      productId: request.productId,
      amount: request.amount,
      status: 'accepted',
      message: 'Investment order accepted successfully.',
    };
  }
}
