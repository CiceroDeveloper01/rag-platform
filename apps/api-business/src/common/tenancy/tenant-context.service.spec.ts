import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  const service = new TenantContextService();

  it('prefers explicit tenant id, then header, then metadata', () => {
    expect(
      service.resolveTenant({
        explicitTenantId: 'tenant-explicit',
        headerTenantId: 'tenant-header',
        metadata: { tenantId: 'tenant-metadata' },
      }),
    ).toBe('tenant-explicit');

    expect(
      service.resolveTenant({
        headerTenantId: 'tenant-header',
        metadata: { tenantId: 'tenant-metadata' },
      }),
    ).toBe('tenant-header');

    expect(
      service.resolveTenant({
        metadata: { tenantId: 'tenant-metadata' },
      }),
    ).toBe('tenant-metadata');
  });

  it('falls back to the default tenant', () => {
    expect(service.resolveTenant({})).toBe('default-tenant');
  });
});
