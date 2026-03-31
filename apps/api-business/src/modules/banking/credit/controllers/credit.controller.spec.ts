import { TenantContextService } from '../../../../common/tenancy/tenant-context.service';
import { CreditController } from './credit.controller';
import { CreditService } from '../services/credit.service';

describe('CreditController', () => {
  it('delegates simulate and contract retrieval to the service', () => {
    const creditService = {
      simulateCredit: jest.fn().mockReturnValue({ monthlyInstallment: 504.17 }),
      getContracts: jest.fn().mockReturnValue([{ contractId: 'ctr-001' }]),
      getLimit: jest.fn().mockReturnValue({ availableLimit: 18000 }),
    } as unknown as CreditService;
    const tenantContextService: Pick<TenantContextService, 'resolveTenant'> = {
      resolveTenant: jest.fn().mockReturnValue('tenant-a'),
    };
    const controller = new CreditController(creditService, tenantContextService);

    expect(
      controller.simulateCredit(
        { requestedAmount: 10000, installmentCount: 24 },
        'tenant-a',
      ),
    ).toEqual({ monthlyInstallment: 504.17 });
    expect(controller.getContracts('tenant-a')).toEqual([
      { contractId: 'ctr-001' },
    ]);
    expect(controller.getLimit('tenant-a')).toEqual({ availableLimit: 18000 });
  });
});
