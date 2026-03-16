import { TenantResolverService } from "./tenant-resolver.service";

describe("TenantResolverService", () => {
  let service: TenantResolverService;

  beforeEach(() => {
    service = new TenantResolverService();
  });

  it("prefers tenant id from headers", () => {
    expect(
      service.resolveTenant({
        headers: {
          "x-tenant-id": "tenant-enterprise",
        },
        metadata: {
          tenantId: "tenant-metadata",
        },
      }),
    ).toBe("tenant-enterprise");
  });

  it("falls back to metadata and then default tenant", () => {
    expect(
      service.resolveTenant({
        metadata: {
          tenantId: "tenant-metadata",
        },
      }),
    ).toBe("tenant-metadata");

    expect(service.resolveTenant({})).toBe("default-tenant");
  });
});
