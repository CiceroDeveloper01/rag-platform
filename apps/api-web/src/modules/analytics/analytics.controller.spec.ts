import { TenantContextService } from '../../common/tenancy/tenant-context.service';
import { AnalyticsController } from './analytics.controller';

describe('AnalyticsController', () => {
  it('resolves the tenant header before querying analytics snapshots', () => {
    const analyticsService = {
      getAgentQuality: jest.fn().mockReturnValue({
        averageQualityScore: 0.9,
        failureRate: 0.1,
      }),
    };
    const tenantContextService = {
      resolveTenant: jest.fn().mockReturnValue('tenant-a'),
    } as unknown as TenantContextService;

    const controller = new AnalyticsController(
      analyticsService as never,
      tenantContextService,
    );

    expect(controller.getAgentQuality('tenant-a')).toEqual({
      averageQualityScore: 0.9,
      failureRate: 0.1,
    });
    expect(tenantContextService.resolveTenant).toHaveBeenCalledWith({
      headerTenantId: 'tenant-a',
    });
    expect(analyticsService.getAgentQuality).toHaveBeenCalledWith('tenant-a');
  });
});
