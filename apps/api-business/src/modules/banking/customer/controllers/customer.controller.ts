import { Controller, Get, Headers } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantContextService } from '../../../../common/tenancy/tenant-context.service';
import { CustomerProfileResponse } from '../dtos/response/customer-profile.response';
import { CustomerSummaryResponse } from '../dtos/response/customer-summary.response';
import { CustomerService } from '../services/customer.service';

@ApiTags('Banking')
@Controller(['banking/customer', 'api/v1/banking/customer'])
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Returns the customer banking profile.' })
  @ApiOkResponse({ type: CustomerProfileResponse })
  getProfile(@Headers('x-tenant-id') tenantIdHeader?: string) {
    return this.customerService.getProfile(
      this.tenantContextService.resolveTenant({ headerTenantId: tenantIdHeader }),
    );
  }

  @Get('summary')
  @ApiOperation({ summary: 'Returns the customer product summary.' })
  @ApiOkResponse({ type: CustomerSummaryResponse })
  getSummary(@Headers('x-tenant-id') tenantIdHeader?: string) {
    return this.customerService.getSummary(
      this.tenantContextService.resolveTenant({ headerTenantId: tenantIdHeader }),
    );
  }
}
