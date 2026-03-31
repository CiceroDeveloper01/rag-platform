import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantContextService } from '../../../../common/tenancy/tenant-context.service';
import { SimulateCreditRequest } from '../dtos/request/simulate-credit.request';
import { CreditContractResponse } from '../dtos/response/credit-contract.response';
import { CreditLimitResponse } from '../dtos/response/credit-limit.response';
import { CreditSimulationResponse } from '../dtos/response/credit-simulation.response';
import { CreditService } from '../services/credit.service';

@ApiTags('Banking')
@Controller(['banking/credit', 'api/v1/banking/credit'])
export class CreditController {
  constructor(
    private readonly creditService: CreditService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post('simulate')
  @ApiOperation({ summary: 'Simulates a credit proposal.' })
  @ApiBody({ type: SimulateCreditRequest })
  @ApiOkResponse({ type: CreditSimulationResponse })
  simulateCredit(
    @Body() request: SimulateCreditRequest,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    return this.creditService.simulateCredit(
      request,
      this.tenantContextService.resolveTenant({ headerTenantId: tenantIdHeader }),
    );
  }

  @Get('contracts')
  @ApiOperation({ summary: 'Lists active credit contracts.' })
  @ApiOkResponse({ type: CreditContractResponse, isArray: true })
  getContracts(@Headers('x-tenant-id') tenantIdHeader?: string) {
    return this.creditService.getContracts(
      this.tenantContextService.resolveTenant({ headerTenantId: tenantIdHeader }),
    );
  }

  @Get('limit')
  @ApiOperation({ summary: 'Returns pre-approved credit limit.' })
  @ApiOkResponse({ type: CreditLimitResponse })
  getLimit(@Headers('x-tenant-id') tenantIdHeader?: string) {
    return this.creditService.getLimit(
      this.tenantContextService.resolveTenant({ headerTenantId: tenantIdHeader }),
    );
  }
}
