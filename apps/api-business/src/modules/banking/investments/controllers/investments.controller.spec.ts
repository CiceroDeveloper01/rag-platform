import { TenantContextService } from '../../../../common/tenancy/tenant-context.service';
import { InvestmentsController } from './investments.controller';
import { InvestmentsService } from '../services/investments.service';

describe('InvestmentsController', () => {
  it('delegates products and simulation calls to the service', () => {
    const investmentsService = {
      listProducts: jest.fn().mockReturnValue([{ id: 'prod-cdb-001' }]),
      simulateInvestment: jest.fn().mockReturnValue({ projectedAmount: 5590 }),
    } as unknown as InvestmentsService;
    const tenantContextService: Pick<TenantContextService, 'resolveTenant'> = {
      resolveTenant: jest.fn().mockReturnValue('tenant-a'),
    };
    const controller = new InvestmentsController(
      investmentsService,
      tenantContextService,
    );

    expect(controller.listProducts('tenant-a')).toEqual([{ id: 'prod-cdb-001' }]);
    expect(
      controller.simulateInvestment(
        { productType: 'cdb', amount: 5000, periodInDays: 365 },
        'tenant-a',
      ),
    ).toEqual({ projectedAmount: 5590 });
  });
});
