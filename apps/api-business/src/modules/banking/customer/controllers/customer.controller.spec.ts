import { TenantContextService } from '../../../../common/tenancy/tenant-context.service';
import { CustomerController } from './customer.controller';
import { CustomerService } from '../services/customer.service';

describe('CustomerController', () => {
  it('delegates profile and summary requests to the service', () => {
    const customerService = {
      getProfile: jest.fn().mockReturnValue({ id: 'cust-001' }),
      getSummary: jest.fn().mockReturnValue({ activeProducts: 4 }),
    } as unknown as CustomerService;
    const tenantContextService: Pick<TenantContextService, 'resolveTenant'> = {
      resolveTenant: jest.fn().mockReturnValue('tenant-a'),
    };
    const controller = new CustomerController(
      customerService,
      tenantContextService,
    );

    expect(controller.getProfile('tenant-a')).toEqual({ id: 'cust-001' });
    expect(controller.getSummary('tenant-a')).toEqual({ activeProducts: 4 });
  });
});
