import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SimulateCreditRequest } from '../dtos/request/simulate-credit.request';
import { CreditContractResponse } from '../dtos/response/credit-contract.response';
import { CreditLimitResponse } from '../dtos/response/credit-limit.response';
import { CreditSimulationResponse } from '../dtos/response/credit-simulation.response';
import { CreditService } from '../services/credit.service';

@ApiTags('Banking')
@Controller(['banking/credit', 'api/v1/banking/credit'])
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Post('simulate')
  @ApiOperation({ summary: 'Simulates a credit proposal.' })
  @ApiBody({ type: SimulateCreditRequest })
  @ApiOkResponse({ type: CreditSimulationResponse })
  simulateCredit(
    @Body() request: SimulateCreditRequest,
  ) {
    return this.creditService.simulateCredit(request);
  }

  @Get('contracts')
  @ApiOperation({ summary: 'Lists active credit contracts.' })
  @ApiOkResponse({ type: CreditContractResponse, isArray: true })
  getContracts() {
    return this.creditService.getContracts();
  }

  @Get('limit')
  @ApiOperation({ summary: 'Returns pre-approved credit limit.' })
  @ApiOkResponse({ type: CreditLimitResponse })
  getLimit() {
    return this.creditService.getLimit();
  }
}
