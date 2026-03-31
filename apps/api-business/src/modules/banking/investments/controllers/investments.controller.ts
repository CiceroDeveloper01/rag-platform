import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateInvestmentOrderRequest } from '../dtos/request/create-investment-order.request';
import { SimulateInvestmentRequest } from '../dtos/request/simulate-investment.request';
import { InvestmentOrderResponse } from '../dtos/response/investment-order.response';
import { InvestmentPortfolioResponse } from '../dtos/response/investment-portfolio.response';
import { InvestmentProductResponse } from '../dtos/response/investment-product.response';
import { InvestmentSimulationResponse } from '../dtos/response/investment-simulation.response';
import { InvestmentsService } from '../services/investments.service';

@ApiTags('Banking')
@Controller(['banking/investments', 'api/v1/banking/investments'])
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get('products')
  @ApiOperation({ summary: 'Lists available investment products.' })
  @ApiOkResponse({ type: InvestmentProductResponse, isArray: true })
  listProducts() {
    return this.investmentsService.listProducts();
  }

  @Get('portfolio')
  @ApiOperation({ summary: 'Returns the customer investment portfolio.' })
  @ApiOkResponse({ type: InvestmentPortfolioResponse })
  getPortfolio() {
    return this.investmentsService.getPortfolio();
  }

  @Post('simulate')
  @ApiOperation({ summary: 'Simulates an investment.' })
  @ApiBody({ type: SimulateInvestmentRequest })
  @ApiOkResponse({ type: InvestmentSimulationResponse })
  simulateInvestment(
    @Body() request: SimulateInvestmentRequest,
  ) {
    return this.investmentsService.simulateInvestment(request);
  }

  @Post('order')
  @ApiOperation({ summary: 'Creates an investment order.' })
  @ApiBody({ type: CreateInvestmentOrderRequest })
  @ApiOkResponse({ type: InvestmentOrderResponse })
  createOrder(
    @Body() request: CreateInvestmentOrderRequest,
  ) {
    return this.investmentsService.createOrder(request);
  }
}
