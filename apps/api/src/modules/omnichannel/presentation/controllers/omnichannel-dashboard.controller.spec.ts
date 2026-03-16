import { TenantContextService } from '../../../../common/tenancy/tenant-context.service';
import { OmnichannelDashboardController } from './omnichannel-dashboard.controller';

describe('OmnichannelDashboardController', () => {
  it('resolves tenant context for dashboard queries', async () => {
    const queryService = {
      getOverview: jest.fn().mockResolvedValue({ totalRequests: 1 }),
    };
    const connectorService = {
      toggle: jest.fn(),
    };
    const tenantContextService = {
      resolveTenant: jest.fn().mockReturnValue('tenant-a'),
    } as unknown as TenantContextService;

    const controller = new OmnichannelDashboardController(
      queryService as never,
      connectorService as never,
      tenantContextService,
    );

    await expect(controller.overview({}, 'tenant-a')).resolves.toEqual({
      totalRequests: 1,
    });
    expect(tenantContextService.resolveTenant).toHaveBeenCalledWith({
      headerTenantId: 'tenant-a',
    });
    expect(queryService.getOverview).toHaveBeenCalledWith({}, 'tenant-a');
  });
});
