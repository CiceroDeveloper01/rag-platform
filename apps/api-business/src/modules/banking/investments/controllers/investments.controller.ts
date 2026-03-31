import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantContextService } from '../../../../common/tenancy/tenant-context.service';
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
  constructor(
    private readonly investmentsService: InvestmentsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get('products')
  @ApiOperation({ summary: 'Lists available investment products.' })
  @ApiOkResponse({ type: InvestmentProductResponse, isArray: true })
  listProducts(@Headers('x-tenant-id') tenantIdHeader?: string) {
    return this.investmentsService.listProducts(
      this.tenantContextService.resolveTenant({ headerTenantId: tenantIdHeader }),
    );
  }

  @Get('portfolio')
  @ApiOperation({ summary: 'Returns the customer investment portfolio.' })
  @ApiOkResponse({ type: InvestmentPortfolioResponse })
  getPortfolio(@Headers('x-tenant-id') tenantIdHeader?: string) {
    return this.investmentsService.getPortfolio(
      this.tenantContextService.resolveTenant({ headerTenantId: tenantIdHeader }),
    );
  }

  @Post('simulate')
  @ApiOperation({ summary: 'Simulates an investment.' })
  @ApiBody({ type: SimulateInvestmentRequest })
  @ApiOkResponse({ type: InvestmentSimulationResponse })
  simulateInvestment(
    @Body() request: SimulateInvestmentRequest,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    return this.investmentsService.simulateInvestment(
      request,
      this.tenantContextService.resolveTenant({ headerTenantId: tenantIdHeader }),
    );
  }

  @Post('order')
  @ApiOperation({ summary: 'Creates an investment order.' })
  @ApiBody({ type: CreateInvestmentOrderRequest })
  @ApiOkResponse({ type: InvestmentOrderResponse })
  createOrder(
    @Body() request: CreateInvestmentOrderRequest,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    return this.investmentsService.createOrder(
      request,
      this.tenantContextService.resolveTenant({ headerTenantId: tenantIdHeader }),
    );
  }
}
