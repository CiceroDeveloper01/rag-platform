import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomerProfileResponse } from '../dtos/response/customer-profile.response';
import { CustomerSummaryResponse } from '../dtos/response/customer-summary.response';
import { CustomerService } from '../services/customer.service';

@ApiTags('Banking')
@Controller(['banking/customer', 'api/v1/banking/customer'])
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Returns the customer banking profile.' })
  @ApiOkResponse({ type: CustomerProfileResponse })
  getProfile() {
    return this.customerService.getProfile();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Returns the customer product summary.' })
  @ApiOkResponse({ type: CustomerSummaryResponse })
  getSummary() {
    return this.customerService.getSummary();
  }
}
